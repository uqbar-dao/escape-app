interface GroupWorkspace {
  type: 'group';
  group: string;
}

interface HomeWorkspace {
  type: 'home'
}

interface Messages {
  type: 'messages'
}

interface UqbarHome {
  type: 'uqbar-home'
}

interface AppsWorkspace {
  type: 'apps'
}

export type Workspace = HomeWorkspace | GroupWorkspace | Messages | UqbarHome | AppsWorkspace;
