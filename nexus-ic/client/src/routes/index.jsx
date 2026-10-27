// Phase route extension point (see PARALLEL_PLAN.md).
// Each phase adds its own file here, named s<phase>.jsx (for example s1a.jsx),
// that default-exports an array of { path, element, roles, public } objects.
// Files are picked up automatically, so no phase edits this file or App.jsx.
const modules = import.meta.glob('./s*.jsx', { eager: true });

const phaseRoutes = Object.keys(modules)
  .sort()
  .flatMap((key) => modules[key].default || []);

export default phaseRoutes;
