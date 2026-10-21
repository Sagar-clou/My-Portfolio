const projectText = value => value.replace(/\\`/g, '`');

const projects = {
  'safe-net': {
    title: 'SAFE-NET Satellite Instant Alert',
    image: 'satellite-alert-project.svg',
    imageAlt: 'Satellite sending an alert from an Earth observation',
    repository: 'https://github.com/Sagar-clou/Satellite-Instant-Alert',
    source: 'https://github.com/Sagar-clou/Satellite-Instant-Alert/tree/main',
    readme: projectText(String.raw`# SAFE-NET Satellite Instant Alert Prototype

This is a working prototype of the SAFE-NET architecture.

## What is live

The prototype can ingest NASA FIRMS near-real-time active-fire satellite products and turn detections into:
- live map markers
- risk levels
- browser notifications
- alert history in the dashboard

NASA FIRMS provides MODIS/VIIRS active-fire products globally in near real time. Exact latency depends on the product and region.

## Run

1. Install Python 3.10+.
2. Create a virtual environment (optional).
3. Install:
   pip install -r requirements.txt

4. Get a NASA FIRMS MAP_KEY from the FIRMS service.
5. Set it:

Windows:
   set FIRMS_MAP_KEY=YOUR_KEY

Linux/macOS:
   export FIRMS_MAP_KEY=YOUR_KEY

6. Start:
   python app.py

7. Open:
   http://localhost:5000

If no MAP_KEY is provided, the application starts in DEMO mode.

## Important engineering note

Satellite observations are not guaranteed to be instantaneous. This prototype therefore labels the data as near-real-time and displays the last successful update. A production emergency system must combine satellite observations with ground sensors and official emergency authorities.

## Patent-oriented architecture

Satellite data -> data fusion -> hazard detection -> risk scoring -> propagation/geofence -> differentiated alert -> emergency response.

The current connector is active-fire detection. Flood, landslide, cyclone and earthquake modules should use validated/authorized feeds and domain-specific models before any real-world emergency deployment.`)
  },
  'family-tree': {
    title: 'Family Tree Generator',
    image: 'family%20tree.png',
    imageAlt: 'Family tree diagram showing connected generations',
    repository: 'https://github.com/Sagar-clou/Family-_Tree-DSA',
    source: 'https://github.com/Sagar-clou/Family-_Tree-DSA/blob/main/Family%20Tree.c',
    readme: projectText(String.raw`# Family Tree Generator (C)

A simple, menu-driven family tree program written in C. It stores family members in a dynamically allocated tree and lets you add children, display the hierarchy, search for a member, and count all members.

## Features

- Choose the root family member when the program starts (defaults to \`Sagar\` if left blank).
- Add a child under an existing parent.
- Display the family hierarchy using an ASCII tree.
- Search for a family member by name.
- Count all members in the tree.
- Validate basic input and check memory-allocation failures.
- Release allocated memory when exiting.

## Project files

- \`Family Tree.c\` — program source code.
- \`README.md\` — this guide.

## Requirements

- A C compiler, such as GCC or Clang.
- A terminal or command prompt.

## Compile

Because the source filename contains spaces, wrap it in quotes.

### GCC

\`\`\`bash
gcc -std=c11 -Wall -Wextra -Wpedantic "Family Tree.c" -o family_tree
\`\`\`

### Clang

\`\`\`bash
clang -std=c11 -Wall -Wextra -Wpedantic "Family Tree.c" -o family_tree
\`\`\`

## Run

On Linux or macOS:

\`\`\`bash
./family_tree
\`\`\`

On Windows (MinGW GCC):

\`\`\`powershell
.\family_tree.exe
\`\`\`

## How to use

1. Start the program.
2. Enter the root member's name, or press Enter to use \`Sagar\`.
3. Select an option from the menu:
   - \`1\` — Add family member. Enter the parent's name and the child's name.
   - \`2\` — Display the whole family tree.
   - \`3\` — Search for a family member by name.
   - \`4\` — Show the total number of family members.
   - \`5\` — Exit the program.

Names are matched exactly, including capitalization. For example, \`Sagar\` and \`sagar\` are treated as different names.

## Example

\`\`\`text
Enter the root family member's name (default: Sagar):

========== FAMILY TREE GENERATOR ==========
1. Add family member
2. Display family tree
3. Search for a family member
4. Show total member count
5. Exit
===========================================
Choose an option (1-5): 1
Enter parent's name: Sagar
Enter child's name: Rahul
Added Rahul as a child of Sagar.

Choose an option (1-5): 2

Family Tree (2 members)
Sagar
   \`-- Rahul
\`\`\`

## Notes and limitations

- This is an in-memory program: the family tree is not saved after the program exits.
- A member is found by the first matching name in the tree. If the same name appears more than once, searching by name may find the earlier match.
- The program models parent-to-child relationships only; it does not separately store spouses, dates, or other family details.

## Possible future improvements

- Save and load the family tree from a file.
- Support deleting or editing family members.
- Use unique IDs to distinguish people who share the same name.
- Add spouse and other relationship types.

## License

You may use, modify, and share this educational project. Add a formal license file if you plan to publish it for broader reuse.`)
  },
  'orbit-chat': {
    title: 'Orbit Chat',
    image: 'orbit-chat-project.svg',
    imageAlt: 'Preview of the Orbit Chat interface with contacts and messages',
    repository: 'https://github.com/Sagar-clou/Chat-Application',
    source: 'https://github.com/Sagar-clou/Chat-Application/tree/main/REAL-TIME%20CHAT%20APP',
    readme: projectText(String.raw`# Orbit Chat — Responsive Chat UI

A polished, teal-accented, responsive chat-interface demo built with plain HTML, CSS, and JavaScript. It is based on the supplied \`new.html\` and fixes the broken JavaScript so the interface can be used locally.

## Features

- Responsive layout for desktop, tablet, and mobile screens
- Contact list with conversation filtering
- Switch between sample conversations
- Send messages and display timestamps
- \`Enter\` sends a message; \`Shift + Enter\` inserts a new line
- Local message history using browser \`localStorage\`
- Clear locally saved chat history
- Accessible labels, keyboard contact selection, and reduced-motion support
- No build step or package installation required

## Run it

1. Keep \`new.html\` in a folder.
2. Open \`new.html\` in a modern browser (Chrome, Edge, Firefox, or Safari).
3. Select a contact, type a message, and press **Enter** or the send button.

You can also serve the folder locally, for example:

\`\`\`bash
python -m http.server 8000
\`\`\`

Then open \`http://localhost:8000/new.html\`.

## Important limitation

This is a **front-end demo only**. It does not connect to a WebSocket server, authenticate users, or send messages to other devices. The contacts and initial messages are sample content; messages you send are stored only in the current browser's local storage. The avatar images use remote URLs and may require an internet connection.

## Files

- \`new.html\` — complete application (HTML, CSS, and JavaScript)
- \`README.md\` — project overview and run instructions

## Technology

- HTML5
- CSS3 (responsive grid/flex layouts, custom properties, media queries)
- Vanilla JavaScript
- Browser \`localStorage\`

## Next steps for a real chat application

To make this a real-time multi-user chat, add a WebSocket backend (for example, Node.js with \`ws\` or Socket.IO), user authentication, server-side message validation, persistent database storage, and appropriate transport security (HTTPS/WSS). Never treat a front-end status label as proof of a real server connection.`)
  },
  learnhub: {
    title: 'LearnHub E-Learning',
    image: 'E_Learning.png',
    imageAlt: 'LearnHub e-learning dashboard and course cards',
    repository: 'https://github.com/Sagar-clou/E_Learning',
    source: 'https://github.com/Sagar-clou/E_Learning/blob/main/index.html',
    readme: projectText(String.raw`# LearnHub --- E-Learning Platform

LearnHub is a responsive e-learning dashboard built with HTML and CSS.
It presents a learning portal where students can explore courses, view
learning progress, watch course content, and see upcoming activities.

## Features

-   Responsive layout for desktop, tablet, and mobile screens
-   LearnHub header and navigation
-   Course search field
-   Hero section with an Explore Courses link
-   Course cards and category filters (as defined in the HTML)
-   Learning progress indicators
-   Embedded video section
-   Sidebar areas for upcoming activities, recent courses, and
    achievements
-   Footer with resource and social links
-   Font Awesome icons and Google Fonts

## Project Structure

\`\`\`text
project/
├── index.html
├── my.jpeg        # Profile image referenced by index.html
└── README.md
\`\`\`

Keep \`my.jpeg\` in the same folder as \`index.html\`, or update the image
path in the HTML to match your file.

## Run Locally

1.  Download or clone the project.
2.  Make sure \`index.html\` and \`my.jpeg\` are in the same folder.
3.  Open \`index.html\` in a web browser.

For a local development server, you can use the VS Code **Live Server**
extension and select **Open with Live Server**.

## Technologies Used

-   HTML5
-   CSS3
-   Google Fonts: Poppins and Open Sans
-   Font Awesome 6.4.0
-   External course/video links

## Configuration

Some links and assets are currently hard-coded in \`index.html\`:

-   Profile image: \`my.jpeg\`
-   Course links: Udemy URLs
-   Explore Courses link: YouTube programming search
-   Font Awesome and Google Fonts: loaded from external CDNs

Change these URLs and asset paths in \`index.html\` to customize the
dashboard.

## Important Notes

-   This project is currently a **front-end website**. The supplied HTML
    does not itself provide user authentication, a database, persistent
    course progress, or a backend API.
-   The search box and course filters require JavaScript to perform
    actual filtering/searching if that behavior is not implemented
    elsewhere in the project.
-   Some websites may block embedding in an iframe. If an embedded
    course page does not load, open the course using a normal link
    instead.
-   External fonts and icons require an internet connection.

## Possible Improvements

-   Add JavaScript for working course search and category filters
-   Add login/signup and user profiles
-   Connect a backend and database to store users, courses, and progress
-   Add course enrollment and lesson tracking
-   Improve accessibility with keyboard navigation and clear focus
    states

## License

No license is specified. Add a \`LICENSE\` file before distributing or
reusing the project if you want to define its usage terms.`)
  }
};

const escapeHtml = value => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderInlineMarkdown = text => escapeHtml(text)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

const renderMarkdown = markdown => {
  const lines = markdown.split(/\r?\n/);
  const output = [];
  let listType = '';
  let codeLines = null;

  const closeList = () => {
    if (listType) output.push(`</${listType}>`);
    listType = '';
  };

  for (let index = 0; index < lines.length;) {
    const line = lines[index];

    if (line.trim().startsWith('```')) {
      closeList();
      if (codeLines) {
        output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = null;
      } else {
        codeLines = [];
      }
      index += 1;
      continue;
    }

    if (codeLines) {
      codeLines.push(line);
      index += 1;
      continue;
    }

    if (!line.trim()) {
      closeList();
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    const unorderedItem = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedItem = line.match(/^\s*\d+\.\s+(.+)$/);
    if (listType && /^\s{2,}\S/.test(line) && !unorderedItem && !orderedItem) {
      const lastItem = output[output.length - 1];
      if (lastItem && lastItem.endsWith('</li>')) {
        output[output.length - 1] = lastItem.replace(/<\/li>$/, ` ${renderInlineMarkdown(line.trim())}</li>`);
        index += 1;
        continue;
      }
    }

    if (unorderedItem || orderedItem) {
      const type = unorderedItem ? 'ul' : 'ol';
      if (listType !== type) {
        closeList();
        listType = type;
        output.push(`<${type}>`);
      }
      output.push(`<li>${renderInlineMarkdown((unorderedItem || orderedItem)[1])}</li>`);
      index += 1;
      continue;
    }

    closeList();
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && lines[index].trim() &&
      !/^#{1,6}\s+/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith('```')) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
  }

  closeList();
  if (codeLines) output.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  return output.join('\n');
};

const projectId = new URLSearchParams(window.location.search).get('project');
const project = projects[projectId];
const detail = document.querySelector('#project-detail-content');
const notFound = document.querySelector('#project-not-found');

if (project) {
  document.title = `${project.title} — Sagar Gupta`;
  document.querySelector('#project-image').src = project.image;
  document.querySelector('#project-image').alt = project.imageAlt;
  document.querySelector('#project-repo').href = project.repository;
  document.querySelector('#project-source').href = project.source;
  document.querySelector('#project-readme').innerHTML = renderMarkdown(project.readme);
  detail.hidden = false;
} else {
  document.title = 'Project not found — Sagar Gupta';
  notFound.hidden = false;
}

if (window.lucide) window.lucide.createIcons();
