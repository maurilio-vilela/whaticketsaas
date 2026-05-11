import Tag from "../../models/Tag";

interface Request {
  tags: Tag[];
}

const SyncKanbanTagsService = async ({
  tags
}: Request): Promise<void> => {
  // Percorre o array recebido. O índice do array (0, 1, 2...) será a nova posição.
  // Promise.all para executar updates em paralelo e ser mais rápido
  await Promise.all(
    tags.map(async (tag, index) => {
      await Tag.update(
        { position: index }, // Define a posição baseada na ordem do array
        { where: { id: tag.id } }
      );
    })
  );
};

export default SyncKanbanTagsService;