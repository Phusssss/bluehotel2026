import { HotelSelectionModal } from '../components/HotelSelectionModal';

export function SelectHotelPage() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
      }}
    >
      <HotelSelectionModal open={true} />
    </div>
  );
}
