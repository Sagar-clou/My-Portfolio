// Default content structure matching index.html.
// Stored in Firestore doc 'settings/site' under field 'content'.
// Allows full CRUD from the Admin Panel via visual forms or direct JSON { key : value }.

export const defaultSiteContent = {
  hero: {
    headline_prefix: "Have an idea?",
    headline_gradient: "Let's make it useful product.",
    lead: "I'm Sagar Gupta, a Computer Science student into full-stack development and data science. I like taking a problem from rough idea to working prototype—with Python, the web, and a lot of learning along the way.",
    degree: "B.Tech · Computer Science",
    location: "Faridabad, India",
    focus_label: "CURRENT FOCUS",
    focus_status: "Building",
    focus_avatar: "sagar-profile.jpg",
    focus_title_line1: "Curious mind.",
    focus_title_line2: "Practical builder.",
    focus_description: "Computer Science student turning ideas into prototypes and experiments.",
    focus_tags: ["Python", "Full-Stack", "AI / ML"],
    focus_badge: "PORTFOLIO"
  },
  about: {
    kicker: "A LITTLE ABOUT ME",
    title_prefix: "Learning by",
    title_gradient: "building.",
    bio: "I'm a passionate student and aspiring Full-Stack who believes in learning through practical experience. I enjoy exploring new technologies, solving problems, and turning ideas into real-world projects. From full-stack development, I'm continuously building my skills by creating projects that combine creativity, logic, and innovation."
  },
  projects_header: {
    kicker: "SELECTED WORK",
    title_prefix: "Projects &",
    title_gradient: "experiments.",
    description: "A few things I've built, explored, and learned from. Open a project card for a fuller overview and a workflow diagram that connects each step to its technology. Each project's current stage is labelled honestly."
  },
  journey: {
    kicker: "THE JOURNEY",
    title_prefix: "Small steps.",
    title_gradient: "Real progress.",
    items: [
      {
        id: "journey-1",
        date: "2025–2026",
        label: "ACADEMIC & WEB PROJECTS",
        title: "Built foundations through practice",
        description: "Worked on Python problem-solving, BFS/DFS maze search, web interface concepts, and neural-network lab exercises.",
        isCurrent: false
      },
      {
        id: "journey-2",
        date: "2026",
        label: "DATA & VISUALIZATION",
        title: "Explored analytics dashboards",
        description: "Developed project ideas around Power BI reporting and healthcare data visualization, focusing on KPIs, filters, and understandable charts.",
        isCurrent: false
      },
      {
        id: "journey-3",
        date: "2026",
        label: "RESEARCH & PROTOTYPING",
        title: "Connected technology with real-world needs",
        description: "Built a satellite fire-alert prototype using NASA FIRMS data, with mapped detections, risk levels, and browser notifications.",
        isCurrent: false
      },
      {
        id: "journey-4",
        date: "NEXT",
        label: "CURRENT DIRECTION",
        title: "Deepen data analytics & data science",
        description: "Keep strengthening Python, SQL, data visualization, and machine-learning fundamentals while documenting projects with working demos.",
        isCurrent: true
      }
    ]
  },
  skills: {
    kicker: "Skills",
    title_gradient: "Full Stack.",
    description: "Web and mobile interfaces connect to a backend, which works with the database to deliver the complete experience.",
    nodes: [
      {
        id: "skill-1",
        step: "01 / WEB",
        title: "Web",
        description: "Build the browser experience.",
        tags: ["HTML", "CSS", "JavaScript"]
      },
      {
        id: "skill-2",
        step: "02 / MOBILE",
        title: "Mobile",
        description: "Build a native app experience.",
        tags: ["React Native", "Learning"]
      },
      {
        id: "skill-3",
        step: "03 / SERVER",
        title: "Backend",
        description: "Handle requests and app logic.",
        tags: ["Python", "Flask Learning"]
      },
      {
        id: "skill-4",
        step: "04 / DATA",
        title: "Database",
        description: "Store and retrieve app data.",
        tags: ["MySQL", "SQL"]
      }
    ],
    flow_kicker: "FROM IDEA TO PRODUCT",
    flow_title: "How I use Full Stack to build a product",
    flow_description: "Each layer has a job. Together, they turn an idea into something people can use.",
    flow_steps: [
      {
        id: "flow-1",
        step: "01 / PLAN",
        title: "Define the problem",
        description: "Choose who the product helps and what it should do."
      },
      {
        id: "flow-2",
        step: "02 / INTERFACE",
        title: "Build the screens",
        description: "Create the web or mobile experience people use."
      },
      {
        id: "flow-3",
        step: "03 / BACKEND",
        title: "Handle the work",
        description: "Process requests and apply the product's rules."
      },
      {
        id: "flow-4",
        step: "04 / DATABASE",
        title: "Save the data",
        description: "Store and retrieve the information the product needs."
      },
      {
        id: "flow-5",
        step: "05 / FINISH",
        title: "Test and launch",
        description: "Check the full journey, fix issues, and share the product."
      }
    ]
  },
  contact: {
    kicker: "LET'S BUILD",
    title_prefix: "Have an idea?",
    title_gradient: "I can turn it into a product.",
    description: "Share the problem you want to solve. Let's shape it into a useful digital product, from the first screen to a working experience.",
    cta_text: "Tell me about your idea",
    whatsapp_number: "919354707042",
    whatsapp_message: "Hi Sagar, I have an idea for a product. Can we talk?",
    email: "guptasagar2201@gmail.com",
    github_url: "https://github.com/Sagar-clou",
    brand_mark: "S",
    brand_name: "sagar.",
    footer_brand_mark: "SG",
    footer_brand_name: "sagar Gupta."
  }
};
