import { PageHeader } from '@/components/ui';
import { ItemForm } from '../item-form';

export const metadata = { title: 'Nuevo producto' };

export default function NuevoProductoPage() {
  return (
    <>
      <PageHeader back={{ href: '/productos', label: 'Productos' }} title="Nuevo producto" subtitle="Registra un producto o servicio en el catálogo." />
      <ItemForm />
    </>
  );
}
