function CategoryTabs({ categories, selectedCategory, onSelect }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
      }}
    >
      {categories.map((category) => {
        const active = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            style={{
              background: active ? 'var(--primary)' : 'white',
              borderRadius: 999,
              color: active ? 'white' : 'var(--text-main)',
              fontWeight: 700,
              padding: '12px 18px',
              whiteSpace: 'nowrap',
              boxShadow: 'var(--shadow)',
            }}
          >
            {category.nome}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryTabs;