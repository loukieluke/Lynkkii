import { ImageResponse } from 'next/og';

export const alt = 'Lynkkii — What’s happening in Jamaica';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #009b3a 0%, #006b28 60%, #fed100 140%)',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -3 }}>Lynkkii</div>
        <div style={{ fontSize: 48, marginTop: 16 }}>What’s happening in Jamaica</div>
        <div style={{ fontSize: 30, marginTop: 32, opacity: 0.85 }}>
          Concerts · Festivals · Sports · Arts · Nightlife
        </div>
      </div>
    ),
    size,
  );
}
