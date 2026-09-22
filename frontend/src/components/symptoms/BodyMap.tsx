import type { CSSProperties } from 'react';
import bodyMapWoman from '@/assets/personaje_mujer.png';
import type { BodyRegionId } from '@/types/symptoms';
import bodyMapMan from '@/assets/personaje_salud.png';

type BodyMapProps = {
  avatarVariant: 'male' | 'female';
  selectedRegionId: BodyRegionId | null;
  onSelectRegion: (regionId: BodyRegionId) => void;
  disabled?: boolean;
};

type MarkerConfig = {
  regionId: BodyRegionId;
  label: string;
  top: string;
  left: string;
  side: 'left' | 'right';
  lineWidth: string;
};

const markers: MarkerConfig[] = [
  {
    regionId: 'oral',
    label: 'Salud oral',
    top: '19%',
    left: '58%',
    side: 'right',
    lineWidth: '26px',
  },
  {
    regionId: 'respiratory',
    label: 'Respiración',
    top: '34%',
    left: '50%',
    side: 'left',
    lineWidth: '20px',
  },
  {
    regionId: 'digestive',
    label: 'Digestivo',
    top: '51%',
    left: '50%',
    side: 'right',
    lineWidth: '24px',
  },
  {
    regionId: 'urinary',
    label: 'Problemas urinarios',
    top: '64%',
    left: '46%',
    side: 'left',
    lineWidth: '18px',
  },
  {
    regionId: 'skin',
    label: 'Piel',
    top: '82%',
    left: '73%',
    side: 'right',
    lineWidth: '16px',
  },
];

export function BodyMap({
  avatarVariant,
  selectedRegionId,
  onSelectRegion,
  disabled = false,
}: BodyMapProps) {
  const hasSelection = selectedRegionId !== null;
  const bodyMapAsset = avatarVariant === 'male' ? bodyMapMan : bodyMapWoman;

  return (
    <div className={disabled ? 'body-map-card body-map-card-disabled' : 'body-map-card'}>
      <div className='body-map__canvas'>
        <div className='body-map__figure'>
          <div className='body-map__image-frame'>
            <img src={bodyMapAsset} alt='Persona de cuerpo completo' className='body-map__image' />
          </div>

          {markers.map(marker => {
            const isSelected = selectedRegionId === marker.regionId;
            const isMuted = hasSelection && !isSelected;

            return (
              <button
                key={marker.regionId}
                type='button'
                className={
                  isSelected
                    ? `body-map__marker body-map__marker-${marker.regionId} body-map__marker-selected`
                    : isMuted
                      ? `body-map__marker body-map__marker-${marker.regionId} body-map__marker-muted`
                      : `body-map__marker body-map__marker-${marker.regionId}`
                }
                style={
                  {
                    top: marker.top,
                    left: marker.left,
                    '--line-width': marker.lineWidth,
                  } as CSSProperties
                }
                aria-label={marker.label}
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onSelectRegion(marker.regionId)}
              >
                <span className='body-map__pin' aria-hidden='true' />
                <span
                  className={
                    marker.side === 'left'
                      ? 'body-map__line body-map__line-left'
                      : 'body-map__line body-map__line-right'
                  }
                  aria-hidden='true'
                />
                <span
                  className={
                    marker.side === 'left'
                      ? 'body-map__label body-map__label-left'
                      : 'body-map__label body-map__label-right'
                  }
                >
                  <span className='body-map__icon' aria-hidden='true'>
                    {renderRegionIcon(marker.regionId)}
                  </span>
                  <span className='body-map__label-text'>{marker.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderRegionIcon(regionId: BodyRegionId) {
  if (regionId === 'oral') {
    return (
      <svg viewBox='0 0 24 24' className='body-map__icon-svg'>
        <path
          d='M6.5 8.5c0-2 1.6-3.5 3.5-3.5 1 0 1.9.4 2.5 1.1.6-.7 1.5-1.1 2.5-1.1 1.9 0 3.5 1.5 3.5 3.5 0 5.6-1.3 10.5-3.3 12.4-.7.7-1.6 1.1-2.7 1.1s-2-.4-2.7-1.1C7.8 19 6.5 14.1 6.5 8.5Z'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinejoin='round'
        />
        <path
          d='M10 8.4v2.7M14 8.4v2.7M12 10.1v3.8'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.6'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  if (regionId === 'respiratory') {
    return (
      <svg viewBox='0 0 24 24' className='body-map__icon-svg'>
        <path
          d='M11.5 4v7.2c0 1.2-.4 2.3-1.2 3.2L8 17.1a3.6 3.6 0 0 1-6.1-2.5c0-1 .4-2 1.1-2.7L6.7 8V4'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M12.5 4v7.2c0 1.2.4 2.3 1.2 3.2l2.3 2.7a3.6 3.6 0 0 0 6.1-2.5c0-1-.4-2-1.1-2.7L17.3 8V4'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  if (regionId === 'digestive') {
    return (
      <svg viewBox='0 0 24 24' className='body-map__icon-svg'>
        <path
          d='M9.5 4c.6 2.2.5 4.3-.5 6-.7 1.2-1.8 2-2.3 3.2-.8 1.8-.6 4 .7 5.6 1 1.3 2.7 2.2 4.5 2.2 3.6 0 6.6-2.8 6.6-6.4 0-1.7-.6-3.1-1.8-4.5-1.3-1.5-1.8-3.6-1.6-6.1'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    );
  }

  if (regionId === 'urinary') {
    return (
      <svg viewBox='0 0 24 24' className='body-map__icon-svg'>
        <path
          d='M7 6c-2.2 0-4 1.8-4 4 0 4 2.8 7 6.1 7 2.6 0 3.9-1.6 3.9-4.2V6H7Z'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinejoin='round'
        />
        <path
          d='M17 6c2.2 0 4 1.8 4 4 0 4-2.8 7-6.1 7-2.6 0-3.9-1.6-3.9-4.2V6H17Z'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinejoin='round'
        />
        <path
          d='M12 17v3'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.8'
          strokeLinecap='round'
        />
      </svg>
    );
  }

  return (
    <svg viewBox='0 0 24 24' className='body-map__icon-svg'>
      <rect
        x='4.5'
        y='4.5'
        width='15'
        height='15'
        rx='3.5'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
      />
      <circle cx='9' cy='9' r='1.2' fill='currentColor' />
      <circle cx='15' cy='9.5' r='1.2' fill='currentColor' />
      <circle cx='11.5' cy='13' r='1.2' fill='currentColor' />
      <circle cx='15.5' cy='15.5' r='1.2' fill='currentColor' />
      <circle cx='8.5' cy='15.5' r='1.2' fill='currentColor' />
    </svg>
  );
}
