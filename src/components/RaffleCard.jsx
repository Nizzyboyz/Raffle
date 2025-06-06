// src/components/RaffleCard.jsx
export default function RaffleCard({
  image,
  name,
  ticketsSold,
  prize,
  timeLeft,
  onBuy,
}) {
  return (
    <div className="bg-white shadow-sm hover:shadow-lg rounded-2xl p-4 flex flex-col gap-3 border border-gray-200">
      <img
        src={image}
        alt={name}
        className="h-28 w-full object-cover rounded-xl"
      />

      <h3 className="text-lg font-semibold leading-tight">{name}</h3>

      <ul className="text-sm text-gray-600 flex flex-col gap-1 flex-1">
        <li>
          <span className="font-medium">Tickets sold:</span> {ticketsSold}
        </li>
        <li>
          <span className="font-medium">Prize:</span> {prize}
        </li>
        <li>
          <span className="font-medium">Time left:</span> {timeLeft}
        </li>
      </ul>

      <button
        onClick={onBuy}
        className="mt-auto py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition"
      >
        Buy Ticket
      </button>
    </div>
  );
}
