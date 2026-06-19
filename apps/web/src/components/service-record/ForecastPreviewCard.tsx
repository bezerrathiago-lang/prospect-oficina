/**
 * ForecastPreviewCard — exibe preview em tempo real do próximo serviço
 *
 * Recebe dailyAverageKm e nextServiceDate como props.
 * Se qualquer prop for null, retorna null (não renderiza nada).
 */

interface ForecastPreviewCardProps {
  dailyAverageKm: number | null;
  nextServiceDate: Date | null;
}

export default function ForecastPreviewCard({
  dailyAverageKm,
  nextServiceDate,
}: ForecastPreviewCardProps) {
  if (dailyAverageKm === null || nextServiceDate === null) {
    return null;
  }

  const formatted = nextServiceDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mt-4">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">
        Previsão do Próximo Serviço
      </h3>
      <div className="space-y-1">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Média:</span>{' '}
          {dailyAverageKm.toFixed(1).replace('.', ',')} km/dia
        </p>
        <p className="text-sm text-blue-700">
          <span className="font-medium">Próximo serviço previsto:</span>{' '}
          {formatted}
        </p>
      </div>
    </div>
  );
}
