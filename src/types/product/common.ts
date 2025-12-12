import type { HttpTypes, PaginatedResponse, InventoryItemDTO, InventoryLevelDTO } from "@medusajs/types";

import type { AttributeDTO } from "@custom-types/attribute";

// TODO: Change any names to have Extended prefix
export type AdminProductListResponse = PaginatedResponse<{
  products: ExtendedAdminProduct[];
}>;

// ok
export interface ExtendedAdminProductResponse {
  product: ExtendedAdminProduct;
}


export interface ExtendedAdminProduct extends Omit<HttpTypes.AdminProduct, 'images' | 'variants'> {
  attribute_values?: AttributeDTO[];
  images: ExtendedAdminProductImage[] | null;
  shipping_profile?: HttpTypes.AdminShippingProfile | null;
  variants: ExtendedAdminProductVariant[]
}

// ok
export interface ExtendedAdminProductImage extends HttpTypes.AdminProductImage {
  url: string
}

// to check
export interface ExtendedAdminInventoryLevel extends HttpTypes.AdminInventoryLevel {
  available_quantity: number;
  stocked_quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
}

// to check
export interface ExtendedAdminInventoryItem extends HttpTypes.AdminInventoryItem {
  location_levels?: ExtendedAdminInventoryLevel[];
  reserved_quantity?: number | null;
  stocked_quantity?: number | null;
}

// to check
export interface AdminProductVariantInventoryItem {
  variant_id: string;
  inventory_item_id: string;
  id: string;
  required_quantity: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inventory: ExtendedAdminInventoryItem;
}


// ok
export interface AdminProductUpdate extends HttpTypes.AdminUpdateProduct {
  additional_data?: {
    values?: Record<string, string>[];
  };
}

export interface ExtendedAdminPrice extends HttpTypes.AdminPrice {
  rules?: Record<string, string>;
}

// ok
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
  prices: ExtendedAdminPrice[] | null;
  inventory_items?: AdminProductVariantInventoryItem[];
  inventory?: ExtendedAdminInventoryItem[];
}


// export interface AdminProductVariantWithInventory extends Omit<HttpTypes.AdminProductVariant, 'inventory_items'> {
//   inventory_items?: AdminProductVariantInventoryItem[];
//   inventory?: ExtendedAdminInventoryItem[];
// }



// TODO: Check later
export interface InventoryItem extends ExtendedAdminInventoryItem {
  required_quantity?: number;
}