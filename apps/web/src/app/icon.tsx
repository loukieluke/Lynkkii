import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #009b3a, #fed100)',
        }}
      />
    ),
    size,
  );
}
