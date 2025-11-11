type Props = {
  title: string;
  onChangeTitle: (s: string) => void;
  onSave: () => void;
  onOpenLibrary: () => void;
};

export default function SaveBar({
  title,
  onChangeTitle,
  onSave,
  onOpenLibrary,
}: Props) {
  return (
    <div className="panel savebar">
      <input
        value={title}
        onChange={(e) => onChangeTitle(e.target.value)}
        placeholder="Título…"
      />
      <button className="btn btn-primary" onClick={onSave}>
        Guardar
      </button>
      <button className="btn btn-ghost" onClick={onOpenLibrary}>
        Biblioteca
      </button>
    </div>
  );
}
