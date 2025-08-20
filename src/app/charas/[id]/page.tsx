export const generateStaticParams = async () => {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default function CharaPage({ params }: { params: { id: string } }) {
  return <div>Chara ID: {params.id}</div>;
}
