import { notFound } from 'next/navigation'
import { ScrollSection } from '@/components/common/scroll-section'
import { MagneticButton } from '@/components/common/magnetic-button'
import HolographicBackground from '@/components/backgrounds/holographic-background'
import ProjectDetailViewer from '@/app/components/ProjectDetailViewer'
import { findProjectBySlug } from '@/lib/prisma'
import type { Project } from '@/app/data/projects'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag, ExternalLink, Github, CheckCircle, Target, Users } from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{
    slug: string
  }>
}

// Type guard to assert project is not undefined after notFound() check
function isProject(project: Project | null | undefined): project is Project {
  return project !== null && project !== undefined
}

// Helper for components requiring children prop
// Revalidate every 60 seconds
export const revalidate = 60

export async function generateStaticParams() {
  // Return empty array to rely on fallback: true for all paths
  return []
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params

  try {
    // Use the safe helper to fetch project (already returns correct Project type)
    const project = await findProjectBySlug(slug)
    
    if (!project) {
      return {
        title: 'Proje Bulunamadı - LnY',
      }
  }

    return {
      title: `${project.title} - LnY`,
      description: project.description,
      keywords: [...project.tags, 'LnY', 'proje', project.category].join(', '),
      openGraph: {
        title: `${project.title} - LnY Projesi`,
        description: project.description,
        type: 'article',
        images: project.images && project.images.length > 0 ? [project.images[0]] : []
      }
    }
  } catch (error) {
    // If DB is not available, return default metadata
    // eslint-disable-next-line no-console
    console.error('Failed to generate metadata (using fallback):', error)
    return {
      title: 'Proje Bulunamadı - LnY',
    }
  }
}

type Project = {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  tags: string[];
  duration: string;
  completedAt: string;
  status: 'completed' | 'in-progress' | 'planned';
  technologies: string[];
  glbUrl?: string;
  images?: string[];
  details?: {
    problem: string;
    solution: string;
    results: string[];
    challenges?: string[];
    testimonial?: {
      content: string;
      author: string;
      role: string;
      company: string;
    };
  };
  links?: {
    demo?: string;
    github?: string;
  };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params

  // Try to fetch from DB (helper returns transformed Project type)
  let project: Project | null = null
  try {
    project = await findProjectBySlug(slug)
  } catch (error) {
    // Log error but continue to static data
    // eslint-disable-next-line no-console
    console.error('Failed to load project from DB (fallback to static):', error)
  }

  // If not found in DB, try static data
  if (!project) {
    const { getProjectBySlug } = await import('@/app/data/projects')
    const staticProject = getProjectBySlug(slug)
    if (staticProject) {
      project = staticProject
    }
  }

  // If still no project found, show 404
  if (!project) {
    notFound()
  }
  const p = project as Project

  return (
    <main className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/projects" className="text-sm underline">← Tüm Projeler</Link>
      </div>

      <h1 className="text-3xl font-bold mb-2">{p.title}</h1>
      <p className="text-gray-600 mb-4">{p.shortDescription || p.description}</p>

      {p.glbUrl && (
        <div className="w-full h-96 mb-6">
          <ProjectDetailViewer glbUrl={p.glbUrl} title={p.title} description={p.description} />
        </div>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-2">Detaylar</h2>
        <p className="whitespace-pre-line">{p.description}</p>
      </section>
    </main>
  )
}
