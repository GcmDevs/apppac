import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import {
  ESTADOS_USUARIO,
  EstadoUsuarioCode,
  estadoUsuarioTypeFactory,
} from '@gen/security/domain/types/gen/usuarios';
import { cryptoServices as crypto, IAuthToken, RSAServices } from '@common/application/services';
import { _PrivSecPacAsUserOrm } from '@common/infrastructure/orm/pacient-as-user.orm';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import { gcmContextFactory } from '@common/domain/types';
import { LoginUserDto } from '@gen/security/presentation/dtos';
import { switchConn } from '@common/infrastructure/services';
import { dataToUsuExtOrm } from '../factories';
import { processEnv } from '@env';
import { _PrivSecPatientOrm } from '@common/infrastructure/orm/pacient.orm';

@Injectable()
export class LoginUserImpl {
  public async execute(body: LoginUserDto) {
    if (body.authAsUser) return this._executeAsUser(body);
    else return this._asPaciente(body);
  }

  private async _executeAsUser(body: LoginUserDto) {
    const errorMsg = 'Usuario y/o clave incorrecta';
    const { username, password } = body;
    const context = gcmContextFactory(body.context);
    const conn = switchConn(context);

    const qr = conn.createQueryRunner();

    await qr.connect();
    try {
      await qr.startTransaction();

      const userRp = qr.manager.getRepository(_PrivSecUserOrm);

      let user: _PrivSecUserOrm | null = null;
      let matchingPasswords = false;
      let isDimUser = true;

      user = await userRp.findOne({
        where: [{ document: username }],
        select: {
          id: true,
          document: true,
          fullName: true,
          password: true,
          statusCode: true,
          lastAuth: true,
        },
      });

      if (!user) throw new Error(errorMsg);

      if (user.statusCode !== ESTADOS_USUARIO.ACTIVO.getCode()) {
        throw new Error(
          `Su usuario está en estado ${estadoUsuarioTypeFactory(user.statusCode as EstadoUsuarioCode).getForHumans()}`
        );
      }

      if (isDimUser) matchingPasswords = await crypto.compareDimPassword(password, user.password);
      else matchingPasswords = await crypto.compare(password, user.password);

      const passwordIsReset = !isDimUser ? (user as any).passwordIsReset : false;

      if (matchingPasswords) {
        const payload: IAuthToken = {
          jti: RSAServices.encryptId(user.id),
          rst: passwordIsReset,
          dcm: user.document,
          fnm: user.fullName,
          pid: undefined!,
          sub: body.context,
          rol: 'USUARIO',
        };

        const token = jwt.sign(payload, processEnv.JWT_SECRET_KEY, {
          expiresIn: '7d',
          algorithm: 'HS512',
        });

        user.lastAuth = new Date();

        await userRp.save(user);

        await qr.commitTransaction();

        return { token, passwordIsReset };
      } else {
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }

  private async _asPaciente(body: LoginUserDto) {
    const errorMsg = 'Usuario y/o clave incorrecta';
    const { username, password } = body;
    const context = gcmContextFactory(body.context);
    const conn = switchConn(context);

    const qr = conn.createQueryRunner();
    const ekQr = conn.createQueryRunner();

    await qr.connect();
    await ekQr.connect();
    try {
      await qr.startTransaction();
      await ekQr.startTransaction();

      const pacienteRp = qr.manager.getRepository(_PrivSecPatientOrm);
      const ekPacienteRp = ekQr.manager.getRepository(_PrivSecPacAsUserOrm);

      const paciente = await pacienteRp.findOne({ where: { document: username } });
      if (!paciente) throw new Error('El paciente no ha sido atendido en esta clinica');

      let pacAsUser = await ekPacienteRp.findOne({
        where: { document: username },
        select: {
          id: true,
          pacientId: true,
          document: true,
          fullName: true,
          password: true,
          statusCode: true,
          passwordIsReset: true,
        },
      });

      if (!pacAsUser) {
        pacAsUser = await dataToUsuExtOrm(paciente);
        pacAsUser = await ekPacienteRp.save(pacAsUser);
      }

      if (pacAsUser.statusCode !== ESTADOS_USUARIO.ACTIVO.getCode()) {
        throw new Error(
          `Su usuario está en estado ${estadoUsuarioTypeFactory(pacAsUser.statusCode as EstadoUsuarioCode).getForHumans()}`
        );
      }

      if (!pacAsUser.passwordIsReset) {
        const matchingPass = await crypto.compare(password, pacAsUser.password);
        if (!matchingPass) throw new Error(errorMsg);
      }

      const payload: IAuthToken = {
        jti: RSAServices.encryptId(pacAsUser.id),
        pid: RSAServices.encryptId(pacAsUser.pacientId),
        rst: pacAsUser.passwordIsReset,
        dcm: paciente.document,
        fnm: paciente.fullName,
        rol: 'PACIENTE',
        sub: body.context,
      };

      const token = jwt.sign(payload, processEnv.JWT_SECRET_KEY, {
        expiresIn: '7d',
        algorithm: 'HS512',
      });

      if (!pacAsUser.passwordIsReset) {
        pacAsUser.lastAuth = new Date();
        await ekPacienteRp.save(pacAsUser);
      }

      await qr.commitTransaction();
      await ekQr.commitTransaction();

      return {
        token,
        passwordIsReset: pacAsUser.passwordIsReset,
        sexo: paciente.genderCode === 1 ? 'M' : paciente.genderCode === 2 ? 'F' : null,
      };
    } catch (error: any) {
      await qr.rollbackTransaction();
      await ekQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
      await ekQr.release();
    }
  }
}
