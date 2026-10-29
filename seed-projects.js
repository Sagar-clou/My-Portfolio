// Your original four projects. Used by the admin panel's "Import existing projects" button
// and as an offline fallback if Firebase is not configured or unreachable.
export const seedProjects = [
  {
    "id": "safe-net",
    "title": "SAFE-NET Satellite Instant Alert",
    "meta": "Python · NASA FIRMS",
    "type": "Prototype",
    "tags": [
      "Python",
      "Satellite data",
      "Alerts"
    ],
    "summary": "A working prototype that uses NASA FIRMS active-fire satellite data to show map detections, risk levels, browser notifications, and alert history. Includes demo mode when no FIRMS key is configured.",
    "image": "satellite-alert-project.svg",
    "imageAlt": "Satellite sending an alert from an Earth observation",
    "repository": "https://github.com/Sagar-clou/Satellite-Instant-Alert",
    "source": "https://github.com/Sagar-clou/Satellite-Instant-Alert/tree/main",
    "readme": "# SAFE-NET Satellite Instant Alert Prototype\n\nThis is a working prototype of the SAFE-NET architecture.\n\n## What is live\n\nThe prototype can ingest NASA FIRMS near-real-time active-fire satellite products and turn detections into:\n- live map markers\n- risk levels\n- browser notifications\n- alert history in the dashboard\n\nNASA FIRMS provides MODIS/VIIRS active-fire products globally in near real time. Exact latency depends on the product and region.\n\n## Run\n\n1. Install Python 3.10+.\n2. Create a virtual environment (optional).\n3. Install:\n   pip install -r requirements.txt\n\n4. Get a NASA FIRMS MAP_KEY from the FIRMS service.\n5. Set it:\n\nWindows:\n   set FIRMS_MAP_KEY=YOUR_KEY\n\nLinux/macOS:\n   export FIRMS_MAP_KEY=YOUR_KEY\n\n6. Start:\n   python app.py\n\n7. Open:\n   http://localhost:5000\n\nIf no MAP_KEY is provided, the application starts in DEMO mode.\n\n## Important engineering note\n\nSatellite observations are not guaranteed to be instantaneous. This prototype therefore labels the data as near-real-time and displays the last successful update. A production emergency system must combine satellite observations with ground sensors and official emergency authorities.\n\n## Patent-oriented architecture\n\nSatellite data -> data fusion -> hazard detection -> risk scoring -> propagation/geofence -> differentiated alert -> emergency response.\n\nThe current connector is active-fire detection. Flood, landslide, cyclone and earthquake modules should use validated/authorized feeds and domain-specific models before any real-world emergency deployment.",
    "order": 10,
    "published": true
  },
  {
    "id": "family-tree",
    "title": "Family Tree Generator",
    "meta": "C · Tree data structure",
    "type": "Command-line app",
    "tags": [
      "C",
      "Data structures",
      "Memory management"
    ],
    "summary": "A menu-driven C program for building and displaying a family tree, adding children, searching members, and counting the tree. The README includes build and run instructions.",
    "image": "family%20tree.png",
    "imageAlt": "Family tree diagram showing connected generations",
    "repository": "https://github.com/Sagar-clou/Family-_Tree-DSA",
    "source": "https://github.com/Sagar-clou/Family-_Tree-DSA/blob/main/Family%20Tree.c",
    "readme": "# Family Tree Generator (C)\n\nA simple, menu-driven family tree program written in C. It stores family members in a dynamically allocated tree and lets you add children, display the hierarchy, search for a member, and count all members.\n\n## Features\n\n- Choose the root family member when the program starts (defaults to `Sagar` if left blank).\n- Add a child under an existing parent.\n- Display the family hierarchy using an ASCII tree.\n- Search for a family member by name.\n- Count all members in the tree.\n- Validate basic input and check memory-allocation failures.\n- Release allocated memory when exiting.\n\n## Project files\n\n- `Family Tree.c` — program source code.\n- `README.md` — this guide.\n\n## Requirements\n\n- A C compiler, such as GCC or Clang.\n- A terminal or command prompt.\n\n## Compile\n\nBecause the source filename contains spaces, wrap it in quotes.\n\n### GCC\n\n```bash\ngcc -std=c11 -Wall -Wextra -Wpedantic \"Family Tree.c\" -o family_tree\n```\n\n### Clang\n\n```bash\nclang -std=c11 -Wall -Wextra -Wpedantic \"Family Tree.c\" -o family_tree\n```\n\n## Run\n\nOn Linux or macOS:\n\n```bash\n./family_tree\n```\n\nOn Windows (MinGW GCC):\n\n```powershell\n.\\family_tree.exe\n```\n\n## How to use\n\n1. Start the program.\n2. Enter the root member's name, or press Enter to use `Sagar`.\n3. Select an option from the menu:\n   - `1` — Add family member. Enter the parent's name and the child's name.\n   - `2` — Display the whole family tree.\n   - `3` — Search for a family member by name.\n   - `4` — Show the total number of family members.\n   - `5` — Exit the program.\n\nNames are matched exactly, including capitalization. For example, `Sagar` and `sagar` are treated as different names.\n\n## Example\n\n```text\nEnter the root family member's name (default: Sagar):\n\n========== FAMILY TREE GENERATOR ==========\n1. Add family member\n2. Display family tree\n3. Search for a family member\n4. Show total member count\n5. Exit\n===========================================\nChoose an option (1-5): 1\nEnter parent's name: Sagar\nEnter child's name: Rahul\nAdded Rahul as a child of Sagar.\n\nChoose an option (1-5): 2\n\nFamily Tree (2 members)\nSagar\n   `-- Rahul\n```\n\n## Notes and limitations\n\n- This is an in-memory program: the family tree is not saved after the program exits.\n- A member is found by the first matching name in the tree. If the same name appears more than once, searching by name may find the earlier match.\n- The program models parent-to-child relationships only; it does not separately store spouses, dates, or other family details.\n\n## Possible future improvements\n\n- Save and load the family tree from a file.\n- Support deleting or editing family members.\n- Use unique IDs to distinguish people who share the same name.\n- Add spouse and other relationship types.\n\n## License\n\nYou may use, modify, and share this educational project. Add a formal license file if you plan to publish it for broader reuse.",
    "order": 20,
    "published": true
  },
  {
    "id": "orbit-chat",
    "title": "Orbit Chat",
    "meta": "HTML · CSS · JavaScript",
    "type": "Front-end demo",
    "tags": [
      "HTML",
      "CSS",
      "JavaScript",
      "localStorage"
    ],
    "summary": "A responsive chat-interface demo with sample conversations, contact filtering, message timestamps, and browser-local message history. Its README clearly notes that it is a front-end demo—not a live multi-user chat service.",
    "image": "orbit-chat-project.svg",
    "imageAlt": "Preview of the Orbit Chat interface with contacts and messages",
    "repository": "https://github.com/Sagar-clou/Chat-Application",
    "source": "https://github.com/Sagar-clou/Chat-Application/tree/main/REAL-TIME%20CHAT%20APP",
    "readme": "# Orbit Chat — Responsive Chat UI\n\nA polished, teal-accented, responsive chat-interface demo built with plain HTML, CSS, and JavaScript. It is based on the supplied `new.html` and fixes the broken JavaScript so the interface can be used locally.\n\n## Features\n\n- Responsive layout for desktop, tablet, and mobile screens\n- Contact list with conversation filtering\n- Switch between sample conversations\n- Send messages and display timestamps\n- `Enter` sends a message; `Shift + Enter` inserts a new line\n- Local message history using browser `localStorage`\n- Clear locally saved chat history\n- Accessible labels, keyboard contact selection, and reduced-motion support\n- No build step or package installation required\n\n## Run it\n\n1. Keep `new.html` in a folder.\n2. Open `new.html` in a modern browser (Chrome, Edge, Firefox, or Safari).\n3. Select a contact, type a message, and press **Enter** or the send button.\n\nYou can also serve the folder locally, for example:\n\n```bash\npython -m http.server 8000\n```\n\nThen open `http://localhost:8000/new.html`.\n\n## Important limitation\n\nThis is a **front-end demo only**. It does not connect to a WebSocket server, authenticate users, or send messages to other devices. The contacts and initial messages are sample content; messages you send are stored only in the current browser's local storage. The avatar images use remote URLs and may require an internet connection.\n\n## Files\n\n- `new.html` — complete application (HTML, CSS, and JavaScript)\n- `README.md` — project overview and run instructions\n\n## Technology\n\n- HTML5\n- CSS3 (responsive grid/flex layouts, custom properties, media queries)\n- Vanilla JavaScript\n- Browser `localStorage`\n\n## Next steps for a real chat application\n\nTo make this a real-time multi-user chat, add a WebSocket backend (for example, Node.js with `ws` or Socket.IO), user authentication, server-side message validation, persistent database storage, and appropriate transport security (HTTPS/WSS). Never treat a front-end status label as proof of a real server connection.",
    "order": 30,
    "published": true
  },
  {
    "id": "learnhub",
    "title": "LearnHub E-Learning",
    "meta": "HTML · CSS",
    "type": "E-learning dashboard",
    "tags": [
      "HTML",
      "CSS",
      "Responsive design"
    ],
    "summary": "A responsive learning dashboard for browsing courses, viewing progress, watching course content, and checking upcoming activities. The README documents setup, assets, and front-end limitations.",
    "image": "E_Learning.png",
    "imageAlt": "LearnHub e-learning dashboard and course cards",
    "repository": "https://github.com/Sagar-clou/E_Learning",
    "source": "https://github.com/Sagar-clou/E_Learning/blob/main/index.html",
    "readme": "# LearnHub --- E-Learning Platform\n\nLearnHub is a responsive e-learning dashboard built with HTML and CSS.\nIt presents a learning portal where students can explore courses, view\nlearning progress, watch course content, and see upcoming activities.\n\n## Features\n\n-   Responsive layout for desktop, tablet, and mobile screens\n-   LearnHub header and navigation\n-   Course search field\n-   Hero section with an Explore Courses link\n-   Course cards and category filters (as defined in the HTML)\n-   Learning progress indicators\n-   Embedded video section\n-   Sidebar areas for upcoming activities, recent courses, and\n    achievements\n-   Footer with resource and social links\n-   Font Awesome icons and Google Fonts\n\n## Project Structure\n\n```text\nproject/\n├── index.html\n├── my.jpeg        # Profile image referenced by index.html\n└── README.md\n```\n\nKeep `my.jpeg` in the same folder as `index.html`, or update the image\npath in the HTML to match your file.\n\n## Run Locally\n\n1.  Download or clone the project.\n2.  Make sure `index.html` and `my.jpeg` are in the same folder.\n3.  Open `index.html` in a web browser.\n\nFor a local development server, you can use the VS Code **Live Server**\nextension and select **Open with Live Server**.\n\n## Technologies Used\n\n-   HTML5\n-   CSS3\n-   Google Fonts: Poppins and Open Sans\n-   Font Awesome 6.4.0\n-   External course/video links\n\n## Configuration\n\nSome links and assets are currently hard-coded in `index.html`:\n\n-   Profile image: `my.jpeg`\n-   Course links: Udemy URLs\n-   Explore Courses link: YouTube programming search\n-   Font Awesome and Google Fonts: loaded from external CDNs\n\nChange these URLs and asset paths in `index.html` to customize the\ndashboard.\n\n## Important Notes\n\n-   This project is currently a **front-end website**. The supplied HTML\n    does not itself provide user authentication, a database, persistent\n    course progress, or a backend API.\n-   The search box and course filters require JavaScript to perform\n    actual filtering/searching if that behavior is not implemented\n    elsewhere in the project.\n-   Some websites may block embedding in an iframe. If an embedded\n    course page does not load, open the course using a normal link\n    instead.\n-   External fonts and icons require an internet connection.\n\n## Possible Improvements\n\n-   Add JavaScript for working course search and category filters\n-   Add login/signup and user profiles\n-   Connect a backend and database to store users, courses, and progress\n-   Add course enrollment and lesson tracking\n-   Improve accessibility with keyboard navigation and clear focus\n    states\n\n## License\n\nNo license is specified. Add a `LICENSE` file before distributing or\nreusing the project if you want to define its usage terms.",
    "order": 40,
    "published": true
  }
];
/* ============================================================
   FILE: seed-projects.js
   ROLE: Seed and fallback project data; used by admin.js and Firebase workflows.
   ============================================================ */
