import { _DataTable } from '@components/table/data-table/data-table';
import { OrderSet } from '@custom-types/order';
import { useOrderSets } from '@hooks/api/orders';
import { useOrderSetTableColumns } from '@hooks/table/columns/use-order-set-table-columns';
import { useOrderSetsTableFilters } from '@hooks/table/filters/use-order-sets-table-filters';
import { useOrderSetsTableQuery } from '@hooks/table/query/use-order-sets-table-query';
import { useDataTable } from '@hooks/use-data-table';
import { Container, Heading } from '@medusajs/ui';
import { keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { hasMultipleOrders } from '../../utils/is-order-set';

const PAGE_SIZE = 20;

export const OrderListTable = () => {
  const { t } = useTranslation();

  const { searchParams, raw } = useOrderSetsTableQuery({
    pageSize: PAGE_SIZE
  });

  const { order_sets, count, isError, error, isLoading } = useOrderSets(
    {
      ...searchParams
    },
    {
      placeholderData: keepPreviousData
    }
  );

  const filters = useOrderSetsTableFilters();
  const columns = useOrderSetTableColumns();

  const { table } = useDataTable<OrderSet>({
    data: order_sets ?? [],
    columns,
    enablePagination: true,
    count,
    pageSize: PAGE_SIZE,
    getRowId: row => row.id,
    getSubRows: row => (hasMultipleOrders(row) ? (row.orders as unknown as OrderSet[]) : []),
    enableExpandableRows: true
  });

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{t('orders.domain')}</Heading>
      </div>
      <_DataTable
        columns={columns}
        table={table}
        pagination
        navigateTo={row => {
          const original = row.original;

          if (row.depth > 0) {
            return `/orders/${original.id}`;
          }

          if (!hasMultipleOrders(original)) {
            return `/orders/${original.orders[0]?.id}`;
          }

          return '';
        }}
        filters={filters}
        count={count}
        search
        isLoading={isLoading}
        pageSize={PAGE_SIZE}
        orderBy={[
          { key: 'display_id', label: t('fields.orderId') },
          { key: 'created_at', label: t('fields.createdAt') },
          { key: 'updated_at', label: t('fields.updatedAt') }
        ]}
        queryObject={raw}
        noRecords={{
          message: t('orders.list.noRecordsMessage')
        }}
        enableExpandAll
      />
    </Container>
  );
};
