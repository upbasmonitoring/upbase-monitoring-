import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

interface Project {
  _id: string;
  name: string;
  description?: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  loading: boolean;
  refreshProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        setProjects([]);
        setSelectedProjectState(null);
        setLoading(false);
        return;
    }

    try {
      const data = await apiFetch('/projects');
      setProjects(data || []);
      
      const storedId = localStorage.getItem('selectedProjectId');
      const found = (data || []).find((p: Project) => p._id === storedId);
      
      if (found) {
        setSelectedProjectState(found);
      } else if (data && data.length > 0) {
        const first = data[0];
        setSelectedProjectState(first);
        localStorage.setItem('selectedProjectId', first._id);
      } else {
        setSelectedProjectState(null);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    // ⚡️ INSTANT SYNC on User Switch/Logout
    const checkUserInterval = setInterval(() => {
        const currentUser = localStorage.getItem('user');
        if (!currentUser && selectedProject) {
            setSelectedProjectState(null);
            setProjects([]);
        }
    }, 2000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        fetchProjects(); // Clear/Update instantly on change
      }
    };

    const handleAuthChange = () => {
        fetchProjects(); // 🔥 Immediate trigger on login signal
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('focus', fetchProjects); // Sync on tab return

    return () => {
        clearInterval(checkUserInterval);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('auth-change', handleAuthChange);
        window.removeEventListener('focus', fetchProjects);
    };
  }, [selectedProject?._id]);

  const setSelectedProject = (project: Project | null) => {
    setSelectedProjectState(project);
    if (project) {
      localStorage.setItem('selectedProjectId', project._id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, selectedProject, setSelectedProject, loading, refreshProjects: fetchProjects }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
