import { PrismaClient } from '@prisma/client'

// Lazily initialize PrismaClient so importing this module doesn't crash
// when DATABASE_URL is missing (e.g. quick dev containers). Callers
// should handle the case where `prisma` is `null` or wrap DB calls in try/catch.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined
}

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    // No DB configured in this environment
    // eslint-disable-next-line no-console
    console.warn('DATABASE_URL not set — Prisma client will not be initialized.')
    return null
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Prisma initialization error:', err)
    return null
  }
}

export const prisma: PrismaClient | null = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) globalForPrisma.prisma = prisma

// Safe helper: return published projects or an empty array when Prisma is not
// initialized. Callers should prefer these helpers when DATABASE_URL may be
// missing in the environment (dev containers, CI without secrets, etc.).
export async function findProjects(args: any) {
  if (!prisma) return []
  return prisma.project.findMany(args)
}

import type { Project } from '@/app/data/projects';

export async function findProjectBySlug(slug: string): Promise<Project | null> {
  if (!prisma) return null

  const dbProject = await prisma.project.findUnique({
    where: { slug, status: 'PUBLISHED' }
  })

  if (!dbProject) return null

  // Transform from Prisma types to our Project type
  return {
    id: dbProject.slug,
    title: dbProject.title,
    description: dbProject.description || '',
    shortDescription: dbProject.description || '',
    category: dbProject.category || 'Diğer',
    tags: dbProject.tags?.split(',').map((t: string) => t.trim()) || [],
    duration: dbProject.duration || '-',
    completedAt: dbProject.publishedAt?.toISOString().split('T')[0] || 
                dbProject.createdAt.toISOString().split('T')[0],
    status: 'completed',
    technologies: dbProject.tags?.split(',').map((t: string) => t.trim()) || [],
    glbUrl: dbProject.glbModelUrl,
    images: dbProject.images?.split(',').map((i: string) => i.trim()),
    details: dbProject.content ? {
      problem: 'Proje detayları',
      solution: dbProject.content,
      results: [],
      challenges: [],
      testimonial: undefined
    } : undefined,
    links: {
      demo: dbProject.demoUrl,
      github: dbProject.githubUrl,
      case_study: `/projects/${dbProject.slug}`
    }
  }
}
