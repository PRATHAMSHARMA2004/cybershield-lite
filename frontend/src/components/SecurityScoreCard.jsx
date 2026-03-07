
const SecurityScoreCard = ({ score }) => {
  const radius = 60;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2}>
          <circle
            stroke="#1f2937"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="currentColor"
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className={getColor()}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getColor()}`}>
            {score}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecurityScoreCard;