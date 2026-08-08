import { SquareClient, SquareEnvironment } from "square";

// Lazy init is mandatory — never create the client at module top-level.
// See booking-system skill: top-level client creation crashes the Vercel
// build because env vars aren't present at build time.
let _square: SquareClient | null = null;

export function getSquare(): SquareClient {
  if (_square) return _square;
  _square = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN!,
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
  return _square;
}
