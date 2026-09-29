import type { ReactNode } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { Page } from './hooks/useWorkspaceNavigation';
export function WorkspacePage({name}:{name:Page}) { const views=useOutletContext<Record<Page,ReactNode>>();return views[name]; }
