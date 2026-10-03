interface StockBadgeProps {
  stock: number;
  unit: string;
}

const StockBadge = ({
  stock,
  unit
}: StockBadgeProps) => {
  if (stock <= 0) {
    return (
      <span className="stock-badge out">
        Out of Stock
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className="stock-badge low">
        Low Stock · {stock} {unit}
      </span>
    );
  }

  return (
    <span className="stock-badge available">
      {stock} {unit} available
    </span>
  );
};

export default StockBadge;