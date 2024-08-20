export interface ItemsServices {
  quoteNumber: string;
  productType: string;
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPriceInclGST: number;
  totalPriceExclGST: number;
}

export enum ProductType {
  InstallTrainingTravel = 'Install Training / Travel Costs',
  Maintenance = 'Maintenance (Monthly Fees)',
  AdditionalItems = 'Additional Items',
}
