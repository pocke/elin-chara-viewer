export const generateStaticParams = async () => {
  return [{ id: '1' }, { id: '2' }, { id: '3' }];
}

export default async function CharaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <div>Chara ID: {params.id}</div>;
}
