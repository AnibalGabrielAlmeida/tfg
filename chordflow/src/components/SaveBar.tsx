type Props = {
  title: string;
  onChangeTitle: (s: string) => void;
  onSave: () => void;
  onOpenLibrary: () => void;
};
export default function SaveBar({ title, onChangeTitle, onSave, onOpenLibrary }: Props) {
  return (
    <div className="savebar">
      <input value={title} onChange={(e)=>onChangeTitle(e.target.value)} placeholder="Título…" />
      <button onClick={onSave}>Guardar</button>
      <button onClick={onOpenLibrary}>Biblioteca</button>
    </div>
  );
}
