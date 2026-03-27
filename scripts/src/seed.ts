import { db, usersTable, coursesTable, sectionsTable, lessonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const [existingAdmin] = await db.select().from(usersTable).where(eq(usersTable.email, "admin@eduplay.com"));
  
  let adminUser;
  if (!existingAdmin) {
    [adminUser] = await db.insert(usersTable).values({
      name: "Admin",
      email: "admin@eduplay.com",
      passwordHash: adminHash,
      role: "admin",
    }).returning();
    console.log("Admin user created:", adminUser.email);
  } else {
    adminUser = existingAdmin;
    console.log("Admin user already exists");
  }

  // Create student user
  const studentHash = await bcrypt.hash("student123", 10);
  const [existingStudent] = await db.select().from(usersTable).where(eq(usersTable.email, "student@eduplay.com"));
  
  if (!existingStudent) {
    const [student] = await db.insert(usersTable).values({
      name: "João Silva",
      email: "student@eduplay.com",
      passwordHash: studentHash,
      role: "student",
    }).returning();
    console.log("Student user created:", student.email);
  } else {
    console.log("Student user already exists");
  }

  // Create demo courses
  const existingCourses = await db.select().from(coursesTable);
  if (existingCourses.length > 0) {
    console.log("Courses already exist, skipping seed");
    process.exit(0);
  }

  const coursesData = [
    {
      title: "Introdução ao JavaScript",
      description: "Aprenda JavaScript do zero ao avançado com projetos práticos. Domine variáveis, funções, arrays, objetos e muito mais.",
      thumbnailUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&q=80",
      isPublished: true,
    },
    {
      title: "React para Iniciantes",
      description: "Construa interfaces modernas com React, hooks e componentes. Aprenda o framework mais popular do mercado.",
      thumbnailUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
      isPublished: true,
    },
    {
      title: "Python e Data Science",
      description: "Análise de dados com Python, Pandas e visualizações. Transforme dados em insights poderosos para negócios.",
      thumbnailUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80",
      isPublished: true,
    },
    {
      title: "Design UI/UX Completo",
      description: "Aprenda os fundamentos de design para criar experiências incríveis. Do wireframe ao protótipo final.",
      thumbnailUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
      isPublished: false,
    },
  ];

  const lessonData = [
    {
      sections: [
        {
          title: "Módulo 1: Fundamentos",
          orderIndex: 0,
          lessons: [
            { title: "Introdução ao Curso", description: "Bem-vindo! Conheça o que você vai aprender.", videoUrl: "https://www.youtube.com/embed/W6NZfCO5SIk", duration: 600 },
            { title: "Ambiente de Desenvolvimento", description: "Configure seu ambiente para começar a programar.", videoUrl: "https://www.youtube.com/embed/hdI2bqOjy3c", duration: 900 },
            { title: "Conceitos Básicos", description: "Os fundamentos essenciais da linguagem.", videoUrl: "https://www.youtube.com/embed/PkZNo7MFNFg", duration: 1200 },
          ]
        },
        {
          title: "Módulo 2: Praticando",
          orderIndex: 1,
          lessons: [
            { title: "Projeto Prático", description: "Construa um projeto completo aplicando o que aprendeu.", videoUrl: "https://www.youtube.com/embed/Vfo-7qAoC-o", duration: 1500 },
            { title: "Dicas e Boas Práticas", description: "Aprenda como escrever código limpo e eficiente.", videoUrl: "https://www.youtube.com/embed/jS4aFq5-91I", duration: 1800 },
          ]
        }
      ]
    }
  ];

  for (let i = 0; i < coursesData.length; i++) {
    const [course] = await db.insert(coursesTable).values(coursesData[i]).returning();
    console.log("Course created:", course.title);

    const template = lessonData[0];
    for (const sectionData of template.sections) {
      const [section] = await db.insert(sectionsTable).values({
        courseId: course.id,
        title: sectionData.title,
        orderIndex: sectionData.orderIndex,
      }).returning();

      for (let j = 0; j < sectionData.lessons.length; j++) {
        const lesson = sectionData.lessons[j];
        await db.insert(lessonsTable).values({
          sectionId: section.id,
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          orderIndex: j,
        });
      }
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
