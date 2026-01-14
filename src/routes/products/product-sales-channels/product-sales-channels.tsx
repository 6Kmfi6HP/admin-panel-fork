import { useParams } from "react-router-dom";

import { RouteFocusModal } from "@components/modals";

import { useProduct } from "@hooks/api";

import { EditSalesChannelsForm } from "@routes/products/product-sales-channels/components/edit-sales-channels-form";

export const ProductSalesChannels = () => {
  const { id } = useParams();
  const { product, isLoading, isError, error } = useProduct(id!);

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal data-testid="product-sales-channels-modal">
      {!isLoading && product && <EditSalesChannelsForm product={product} />}
    </RouteFocusModal>
  );
};
