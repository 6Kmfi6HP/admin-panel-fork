import type { HttpTypes, PaginatedResponse } from "@medusajs/types";

import type { AttributeDTO } from "@custom-types/attribute";

export type ExtendedAdminProductListResponse = PaginatedResponse<{
  products: ExtendedAdminProduct[];
}>;

export interface ExtendedAdminProductResponse {
  product: ExtendedAdminProduct;
}

export interface ExtendedAdminProduct extends Omit<HttpTypes.AdminProduct, 'images' | 'variants'> {
  attribute_values?: AttributeDTO[];
  images: ExtendedAdminProductImage[];
  shipping_profile?: HttpTypes.AdminShippingProfile | null;
  variants: ExtendedAdminProductVariant[];
}

export interface ExtendedAdminProductImage extends HttpTypes.AdminProductImage {
  url: string
}

export interface ExtendedAdminProductVariantInventoryLevel extends HttpTypes.AdminInventoryLevel {
  available_quantity: number;
  stocked_quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
}

export interface ExtendedAdminProductVariantInventoryItem extends HttpTypes.AdminInventoryItem {
  location_levels?: ExtendedAdminProductVariantInventoryLevel[];
  reserved_quantity?: number | null;
  stocked_quantity?: number | null;
}

export interface ExtendedAdminProductVariantInventoryItemLink {
  variant_id: string;
  inventory_item_id: string;
  id: string;
  required_quantity: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inventory: ExtendedAdminProductVariantInventoryItem;
}

export interface ExtendedAdminProductUpdate extends HttpTypes.AdminUpdateProduct {
  additional_data?: {
    values?: Record<string, string>[];
  };
}

export interface ExtendedAdminPrice extends HttpTypes.AdminPrice {
  rules?: Record<string, string>;
}

export interface ExtendedAdminProductListParams extends HttpTypes.AdminProductListParams {
  tag_id?: string | string[]
}

// --- Product variants ---

export interface ExtendedAdminProductVariantListResponse extends Omit<HttpTypes.AdminProductVariantListResponse, 'variants'> {
  variants: ExtendedAdminProductVariant[];
}

export interface ExtendedAdminProductVariantResponse {
  variant: ExtendedAdminProductVariant;
}

export interface ExtendedAdminProductVariant extends Omit<HttpTypes.AdminProductVariant, 'prices' | 'inventory_items'> {
  prices: ExtendedAdminPrice[];
  inventory_items?: ExtendedAdminProductVariantInventoryItemLink[];
  inventory?: ExtendedAdminProductVariantInventoryItem[];
}

export interface ExtendedAdminProductVariantInventoryItemWithQuantity extends ExtendedAdminProductVariantInventoryItem {
  required_quantity: number;
}