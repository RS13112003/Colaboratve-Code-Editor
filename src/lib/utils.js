import clsx from "clsx";

export const cn = (...values) => clsx(values);

export const formatDateTime = (value) => {
  if (!value) return "Just now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const getFileExtension = (language) => {
  switch (language) {
    case "html":
      return ".html";
    case "css":
      return ".css";
    default:
      return ".js";
  }
};

export const normalizeFileName = (name, language) => {
  const trimmed = name.trim().replace(/\s+/g, "-").toLowerCase();
  const extension = getFileExtension(language);

  if (!trimmed) {
    return `untitled${extension}`;
  }

  return trimmed.endsWith(extension) ? trimmed : `${trimmed}${extension}`;
};

export const getLanguageLabel = (language) => {
  switch (language) {
    case "html":
      return "HTML";
    case "css":
      return "CSS";
    default:
      return "JavaScript";
  }
};

export const buildPreviewDocument = (files) => {
  const html = files.find((file) => file.language === "html")?.content ?? "";
  const css = files.find((file) => file.language === "css")?.content ?? "";
  const js = files.find((file) => file.language === "javascript")?.content ?? "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script type="module">
          try {
            ${js}
          } catch (error) {
            console.error(error);
            const pre = document.createElement("pre");
            pre.textContent = error.message;
            pre.style.color = "crimson";
            document.body.appendChild(pre);
          }
        </script>
      </body>
    </html>
  `;
};

export const getWorkspaceAccent = (index = 0) => {
  const accents = [
    "from-amber-300 via-orange-300 to-rose-400",
    "from-sky-300 via-cyan-300 to-emerald-300",
    "from-lime-300 via-emerald-300 to-teal-400",
    "from-fuchsia-300 via-pink-300 to-orange-300",
  ];

  return accents[index % accents.length];
};
