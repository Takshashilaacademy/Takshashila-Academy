import { useEffect } from "react";

function SEO({
  title,
  description,
  path = "/",
}) {
  useEffect(() => {
    const siteName = "Takshashila Academy";
    const baseUrl =
      "https://takshashila-academy.onrender.com";

    const fullTitle = title
      ? `${title} | ${siteName}`
      : siteName;

    const canonicalUrl = `${baseUrl}${path}`;

    document.title = fullTitle;

    // Description
    let descriptionTag = document.querySelector(
      'meta[name="description"]'
    );

    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute(
        "name",
        "description"
      );
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.setAttribute(
      "content",
      description || ""
    );

    // Canonical
    let canonicalTag = document.querySelector(
      'link[rel="canonical"]'
    );

    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute(
        "rel",
        "canonical"
      );
      document.head.appendChild(canonicalTag);
    }

    canonicalTag.setAttribute(
      "href",
      canonicalUrl
    );

    // Open Graph title
    setMetaProperty(
      "og:title",
      fullTitle
    );

    // Open Graph description
    setMetaProperty(
      "og:description",
      description || ""
    );

    // Open Graph URL
    setMetaProperty(
      "og:url",
      canonicalUrl
    );

    // Twitter title
    setMetaName(
      "twitter:title",
      fullTitle
    );

    // Twitter description
    setMetaName(
      "twitter:description",
      description || ""
    );

    return () => {
      // No cleanup required.
    };
  }, [title, description, path]);

  return null;
}


/* =========================================================
   META PROPERTY HELPER
========================================================= */

function setMetaProperty(property, content) {
  let tag = document.querySelector(
    `meta[property="${property}"]`
  );

  if (!tag) {
    tag = document.createElement("meta");

    tag.setAttribute(
      "property",
      property
    );

    document.head.appendChild(tag);
  }

  tag.setAttribute(
    "content",
    content
  );
}


/* =========================================================
   META NAME HELPER
========================================================= */

function setMetaName(name, content) {
  let tag = document.querySelector(
    `meta[name="${name}"]`
  );

  if (!tag) {
    tag = document.createElement("meta");

    tag.setAttribute(
      "name",
      name
    );

    document.head.appendChild(tag);
  }

  tag.setAttribute(
    "content",
    content
  );
}


export default SEO;