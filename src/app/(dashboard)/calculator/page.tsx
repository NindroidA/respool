import { getSpoolsForCalculator } from "./actions";
import { CalculatorClient } from "./calculator-client";

export default async function CalculatorPage() {
  const inventorySpools = await getSpoolsForCalculator();

  return <CalculatorClient inventorySpools={inventorySpools} />;
}
