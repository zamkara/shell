import {
  BarChart3Icon,
  BlocksIcon,
  CircleDotIcon,
  FileTextIcon,
  FolderOpenIcon,
  HelpCircleIcon,
  PlusIcon,
  SaveIcon,
  ShieldCheckIcon,
  UsersIcon,
  KeyRoundIcon,
  type LucideIcon,
} from "lucide-react"

export type CollectionKey =
  | "projects"
  | "faqs"
  | "pricing"
  | "content"
  | "users"
  | "roles"
  | "permissions"
export type ContentCollectionKey = Exclude<CollectionKey, "projects">
export const CONTENT_COLLECTION_KEYS: ContentCollectionKey[] = [
  "faqs",
  "pricing",
  "content",
  "users",
  "roles",
  "permissions",
]

export interface ContentEditorField {
  key: string
  control:
    | "input"
    | "password"
    | "textarea"
    | "json"
    | "multiselect"
    | "permission-matrix"
  placeholder: string
  label?: string
  optionsCollection?: "roles" | "permissions"
  optionLabelField?: string
  createOnly?: boolean
  readOnlyWhenSystem?: boolean
  readOnlyWhen?: Record<string, string | boolean>
}

export interface ContentEditorConfig {
  listField: string
  createMethod: "POST" | "PUT"
  initialValue: Record<string, unknown>
  fields: ContentEditorField[]
}

export interface CollectionConfig {
  endpoint: string
  adminEndpoint?: string
  mutationByPath?: boolean
  label: string
  emptyTitle: string
  emptyDescription: string
  editorEmptyTitle: string
  editorEmptyDescription: string
  searchPlaceholder: string
  newActionLabel: string
  icon: LucideIcon
  permission: string
  editor?: ContentEditorConfig
}

export const COLLECTION_CONFIGS: Record<CollectionKey, CollectionConfig> = {
  projects: {
    endpoint: "/api/admin/projects",
    adminEndpoint: "/api/admin/projects",
    label: "Project",
    emptyTitle: "No projects yet",
    emptyDescription:
      "Use New Project in the toolbar to create the first project.",
    editorEmptyTitle: "No project open",
    editorEmptyDescription:
      "Select a project from the list, or use New Project in the toolbar.",
    searchPlaceholder: "Search projects...",
    newActionLabel: "New Project",
    icon: FolderOpenIcon,
    permission: "projects.read",
  },
  faqs: {
    endpoint: "/api/admin/faqs",
    label: "FAQ",
    emptyTitle: "No FAQs yet",
    emptyDescription: "Use New FAQ in the toolbar to create one.",
    editorEmptyTitle: "No FAQ open",
    editorEmptyDescription: "Choose an FAQ or use New FAQ in the toolbar.",
    searchPlaceholder: "Search FAQs...",
    newActionLabel: "New FAQ",
    icon: HelpCircleIcon,
    permission: "faqs.read",
    editor: {
      listField: "question",
      createMethod: "POST",
      initialValue: {
        category: "home",
        question: "",
        answer: "",
        order_index: 0,
      },
      fields: [
        { key: "category", control: "input", placeholder: "Category" },
        { key: "question", control: "input", placeholder: "Question" },
        { key: "answer", control: "textarea", placeholder: "Answer" },
      ],
    },
  },
  pricing: {
    endpoint: "/api/admin/pricing",
    label: "Pricing Tier",
    emptyTitle: "No pricing tiers yet",
    emptyDescription: "Use New Tier in the toolbar to create one.",
    editorEmptyTitle: "No pricing tier open",
    editorEmptyDescription:
      "Choose a pricing tier or use New Tier in the toolbar.",
    searchPlaceholder: "Search pricing tiers...",
    newActionLabel: "New Tier",
    icon: BarChart3Icon,
    permission: "pricing.read",
    editor: {
      listField: "name",
      createMethod: "POST",
      initialValue: {
        name: "",
        basis: "",
        for_desc: "",
        items: [],
        order_index: 0,
      },
      fields: [
        { key: "name", control: "input", placeholder: "Name" },
        { key: "basis", control: "input", placeholder: "Basis" },
        {
          key: "for_desc",
          control: "textarea",
          placeholder: "Description",
        },
        { key: "items", control: "json", placeholder: "Items JSON array" },
      ],
    },
  },
  content: {
    endpoint: "/api/admin/content",
    label: "Site Setting",
    emptyTitle: "No site settings yet",
    emptyDescription: "Use New Setting in the toolbar to create one.",
    editorEmptyTitle: "No site setting open",
    editorEmptyDescription:
      "Choose a site setting or use New Setting in the toolbar.",
    searchPlaceholder: "Search site settings...",
    newActionLabel: "New Setting",
    icon: FileTextIcon,
    permission: "content.read",
    editor: {
      listField: "key",
      createMethod: "PUT",
      initialValue: { key: "", value: {} },
      fields: [
        { key: "key", control: "input", placeholder: "Key" },
        { key: "value", control: "json", placeholder: "Value JSON" },
      ],
    },
  },
  users: {
    endpoint: "/api/admin/users",
    label: "User",
    emptyTitle: "No users yet",
    emptyDescription: "Use New User in the toolbar to create one.",
    editorEmptyTitle: "No user open",
    editorEmptyDescription: "Choose a user or use New User in the toolbar.",
    searchPlaceholder: "Search users...",
    newActionLabel: "New User",
    icon: UsersIcon,
    permission: "users.read",
    mutationByPath: true,
    editor: {
      listField: "display_name",
      createMethod: "POST",
      initialValue: {
        email: "",
        password: "",
        full_name: "",
        avatar_url: "",
        role_ids: [],
      },
      fields: [
        { key: "email", control: "input", placeholder: "Email" },
        {
          key: "password",
          control: "password",
          placeholder: "Temporary password",
          createOnly: true,
        },
        { key: "full_name", control: "input", placeholder: "Full name" },
        {
          key: "avatar_url",
          control: "input",
          placeholder: "Avatar URL (optional)",
        },
        {
          key: "role_ids",
          control: "multiselect",
          placeholder: "Assign roles",
          optionsCollection: "roles",
          optionLabelField: "name",
        },
      ],
    },
  },
  roles: {
    endpoint: "/api/admin/roles",
    label: "Role",
    emptyTitle: "No roles yet",
    emptyDescription: "Use New Role in the toolbar to create one.",
    editorEmptyTitle: "No role open",
    editorEmptyDescription: "Choose a role or use New Role in the toolbar.",
    searchPlaceholder: "Search roles...",
    newActionLabel: "New Role",
    icon: ShieldCheckIcon,
    permission: "roles.read",
    mutationByPath: true,
    editor: {
      listField: "name",
      createMethod: "POST",
      initialValue: { name: "", description: "", permission_ids: [] },
      fields: [
        {
          key: "name",
          control: "input",
          label: "Role name",
          placeholder: "Role name",
          readOnlyWhenSystem: true,
        },
        {
          key: "description",
          control: "textarea",
          label: "Description",
          placeholder: "Description",
        },
        {
          key: "permission_ids",
          control: "permission-matrix",
          placeholder: "Grant permissions",
          optionsCollection: "permissions",
          optionLabelField: "key",
          readOnlyWhen: { is_system: true, name: "admin" },
        },
      ],
    },
  },
  permissions: {
    endpoint: "/api/admin/permissions",
    label: "Permission",
    emptyTitle: "No permissions yet",
    emptyDescription: "Use New Permission in the toolbar to create one.",
    editorEmptyTitle: "No permission open",
    editorEmptyDescription:
      "Choose a permission or use New Permission in the toolbar.",
    searchPlaceholder: "Search permissions...",
    newActionLabel: "New Permission",
    icon: KeyRoundIcon,
    permission: "permissions.read",
    mutationByPath: true,
    editor: {
      listField: "key",
      createMethod: "POST",
      initialValue: { key: "", description: "" },
      fields: [
        {
          key: "key",
          control: "input",
          placeholder: "module.action",
          readOnlyWhenSystem: true,
        },
        { key: "description", control: "textarea", placeholder: "Description" },
      ],
    },
  },
}

export function collectionDetailURL(collectionKey: CollectionKey, id: string) {
  return `${COLLECTION_CONFIGS[collectionKey].endpoint}/${encodeURIComponent(id)}`
}

export function collectionMutationURL(
  collectionKey: CollectionKey,
  id?: string
) {
  const endpoint =
    COLLECTION_CONFIGS[collectionKey].adminEndpoint ??
    COLLECTION_CONFIGS[collectionKey].endpoint
  if (!id) return endpoint
  return COLLECTION_CONFIGS[collectionKey].mutationByPath
    ? `${endpoint}/${encodeURIComponent(id)}`
    : `${endpoint}?id=${encodeURIComponent(id)}`
}

export const COLLECTION_DEFAULTS = {
  page: 1,
  limit: 10,
  maxLimit: 100,
  debounceMs: 250,
} as const

export const SHELL_EVENTS = {
  toolbarAction: "shell:toolbar-action",
  editorState: "shell:editor-state",
} as const

export const TOOLBAR_ACTION_IDS = {
  newProject: "new-project",
  saveProject: "save-project",
  addMeta: "add-meta",
  addStat: "add-stat",
  setStatus: "set-status",
  newContent: "new-content",
  saveContent: "save-content",
} as const

export interface ToolbarActionOption {
  label: string
  value: string
}

export interface ToolbarAction {
  id: string
  label: string
  icon: LucideIcon
  options?: ToolbarActionOption[]
  requiresEditor?: boolean
  permission?: string
}

export interface PageConfig {
  path: string
  collectionKey?: CollectionKey
  navIcon: LucideIcon
  title: string
  description: string
  actions: ToolbarAction[]
  showInNavigation?: boolean
  permission?: string
  role?: string
  navigationGroup?: "content" | "administration"
}

const shellConfig: PageConfig = {
  path: "/shell",
  collectionKey: "projects",
  navIcon: FolderOpenIcon,
  title: "Projects",
  description: "Manage your projects and resources.",
  permission: "projects.read",
  navigationGroup: "content",
  actions: [
    {
      id: TOOLBAR_ACTION_IDS.newProject,
      label: COLLECTION_CONFIGS.projects.newActionLabel,
      icon: PlusIcon,
      permission: "projects.create",
    },
    {
      id: TOOLBAR_ACTION_IDS.addMeta,
      label: "Add Meta",
      icon: PlusIcon,
      requiresEditor: true,
      permission: "projects.update",
    },
    {
      id: TOOLBAR_ACTION_IDS.addStat,
      label: "Add Stat",
      icon: PlusIcon,
      requiresEditor: true,
      permission: "projects.update",
    },
    {
      id: TOOLBAR_ACTION_IDS.setStatus,
      label: "Status",
      icon: CircleDotIcon,
      requiresEditor: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Archived", value: "archived" },
        { label: "Published", value: "published" },
      ],
      permission: "projects.update",
    },
    {
      id: TOOLBAR_ACTION_IDS.saveProject,
      label: "Save",
      icon: SaveIcon,
      requiresEditor: true,
      permission: "projects.update",
    },
  ],
}

function contentPageConfig(
  collectionKey: ContentCollectionKey,
  title: string,
  description: string
): PageConfig {
  const collection = COLLECTION_CONFIGS[collectionKey]
  return {
    path: `/shell/${collectionKey}`,
    collectionKey,
    navIcon: collection.icon,
    title,
    description,
    permission: collection.permission,
    navigationGroup: "content",
    actions: [
      {
        id: TOOLBAR_ACTION_IDS.newContent,
        label: collection.newActionLabel,
        icon: PlusIcon,
        permission: `${collectionKey}.create`,
      },
      {
        id: TOOLBAR_ACTION_IDS.saveContent,
        label: "Save",
        icon: SaveIcon,
        requiresEditor: true,
        permission: `${collectionKey}.update`,
      },
    ],
  }
}

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  "/shell": shellConfig,
  "/shell/faqs": contentPageConfig(
    "faqs",
    "FAQs",
    "Manage frequently asked questions."
  ),
  "/shell/pricing": contentPageConfig(
    "pricing",
    "Pricing",
    "Manage pricing tiers."
  ),
  "/shell/content": contentPageConfig(
    "content",
    "Site Content",
    "Manage global site settings."
  ),
  "/shell/users": {
    ...contentPageConfig(
      "users",
      "Users",
      "Manage users and role assignments."
    ),
    role: "admin",
    navigationGroup: "administration",
  },
  "/shell/roles": {
    ...contentPageConfig(
      "roles",
      "Roles",
      "Manage roles and permission grants."
    ),
    role: "admin",
    navigationGroup: "administration",
  },
  "/shell/permissions": {
    ...contentPageConfig(
      "permissions",
      "Permissions",
      "Manage the permission catalog."
    ),
    role: "admin",
    navigationGroup: "administration",
  },
}

export interface ShellNavigationItem {
  label: string
  icon: LucideIcon
  href?: string
  permission?: string
  role?: string
  defaultOpen?: boolean
  children?: ShellNavigationItem[]
}

const SHELL_NAVIGATION_GROUPS = [
  {
    key: "content" as const,
    label: "Content",
    icon: BlocksIcon,
  },
  {
    key: "administration" as const,
    label: "Administration",
    icon: ShieldCheckIcon,
  },
]

export const SHELL_NAV_TREE: ShellNavigationItem[] =
  SHELL_NAVIGATION_GROUPS.map((group) => ({
    label: group.label,
    icon: group.icon,
    defaultOpen: true,
    children: Object.values(PAGE_CONFIGS)
      .filter(
        (page) =>
          page.showInNavigation !== false && page.navigationGroup === group.key
      )
      .map((page) => ({
        label: page.title,
        icon: page.navIcon,
        href: page.path,
        permission: page.permission,
        role: page.role,
      })),
  }))
