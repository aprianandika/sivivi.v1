export const templateService = {
  list: () => window.api.templates.list(),
  preview: (id) => window.api.templates.previewDataUrl(id),
};
