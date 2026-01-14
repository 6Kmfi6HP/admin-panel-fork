import { SingleColumnPage } from "@components/layout/pages";

import { OrderListTable } from "@routes/orders/order-list/components/order-list-table";

import { useExtension } from "@providers/extension-provider";

export const OrderList = () => {
  const { getWidgets } = useExtension();

  return (
    <SingleColumnPage
      widgets={{
        after: getWidgets("order.list.after"),
        before: getWidgets("order.list.before"),
      }}
      hasOutlet={false}
      data-testid="orders-list-page"
    >
      <OrderListTable />
    </SingleColumnPage>
  );
};
