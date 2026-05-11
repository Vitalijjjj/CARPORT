/*
 * MySQL schema (future migration):
 *
 * CREATE TABLE cars (
 *   id            VARCHAR(100)  PRIMARY KEY,
 *   name          VARCHAR(200)  NOT NULL,
 *   tagline       VARCHAR(200),
 *   brand         ENUM('bmw','mercedes') NOT NULL,
 *   fuel_type     ENUM('electric','hybrid') NOT NULL,
 *   price         DECIMAL(10,2) NOT NULL,
 *   year          SMALLINT      NOT NULL,
 *   mileage_km    INT           NOT NULL,
 *   status        ENUM('in_stock','incoming','reserved') DEFAULT 'in_stock',
 *   financing     BOOLEAN       DEFAULT FALSE,
 *   warranty      BOOLEAN       DEFAULT FALSE,
 *   hp            SMALLINT,
 *   engine        VARCHAR(50),
 *   drivetrain    ENUM('RWD','AWD','FWD'),
 *   seats         TINYINT,
 *   img           VARCHAR(500),
 *   created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
 * );
 */

export const OLIMP_CARS = [
  {
    id: "bmw-i4-edrive40",
    name: "BMW i4 eDrive40",
    tagline: "Electric Gran Coupé",
    brand: "bmw",
    fuelType: "electric",
    financing: true,
    warranty: true,
    price: 52900,
    priceUnit: "unit",
    seats: 5,
    gearbox: "Automatic",
    luggage: "3 bags",
    year: 2023,
    engine: "Electric",
    hp: "340 HP",
    topSpeed: "190 km/h",
    mileage: "38 000 km",
    mileageNum: 38000,
    status: "in_stock",
    drivetrain: "RWD",
    range: "590 km",
    img: "assets/car-bmw-i4.jpg",
    gallery: [
      "assets/car-bmw-i4.jpg",
      "assets/about-car.jpg",
      "assets/brand-1.jpg",
      "assets/brand-2.jpg",
    ],
    description: "A premium electric Gran Coupé with refined performance, modern technology and everyday comfort. The BMW i4 eDrive40 combines sporty dynamics with a long-range battery, making it ideal for both city driving and longer journeys across Portugal.",
    features: [
      "Battery health verified",
      "Warranty available",
      "Financing available",
      "Curved display with iDrive 8",
      "Heated front seats",
      "Wireless Apple CarPlay & Android Auto",
      "Adaptive cruise control",
      "Parking assistant",
      "Sport seats",
      "19-inch alloy wheels",
    ],
  },
  // Add real cars via the admin panel
];
