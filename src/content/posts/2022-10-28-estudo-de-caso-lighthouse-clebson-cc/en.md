---
slug: estudo-de-caso-lighthouse-clebson-cc
translationKey: estudo-de-caso-lighthouse-clebson-cc
locale: en
title: Lighthouse case study on the old clebson.cc
kicker: SEO
date: 2022-10-28
readingTime: 4 MIN READ
author: whoisclebs
excerpt: How I worked on accessibility, best practices, and SEO to reach 100 points on Lighthouse on my old personal website.
cover: https://miro.medium.com/v2/resize:fit:700/1*rnvdQgcC4I-dAP04j_C0fQ.png
coverAlt: Lighthouse audit screenshot with scores in green
published: true
---

A while back, when I was still using the clebson.cc domain, I was working on improving my personal branding. One of the first goals was to improve the SEO of the page I used to introduce myself.

After a few iterations, I managed to hit 100 on all Lighthouse scores. This post isn't exactly a tutorial — it's more of a record of the path I followed and the things I had to study along the way.

## Note about the domain

The domain mentioned in the original article was clebson.cc. Today, my personal site and blog live at whoisclebs.com. The intention remains similar: maintaining a public presence with context about my work, projects, and writing.

## First step: accessibility

The first point, and perhaps the hardest for me at the time, was accessibility.

It was interesting to revisit concepts I had already been teaching my students, but now applying them in a real scenario. One of the questions that always comes up when talking about ARIA is: when should you use it?

After this experience, the answer became clearer to me: ARIA is useful when dealing with components that aren't semantically clear by default. For example, if you build a progress bar using a `div`, that element doesn't carry enough semantics on its own. In that case, ARIA attributes help assistive technologies understand the role of that element.

I also had to review image alt texts. This detail seems simple, but it directly impacts the experience of people navigating with screen readers and also helps SEO itself.

It was after these adjustments that I managed to close 100 on accessibility.

## Second step: best practices

Since it was a relatively simple site, the best practices score started high.

Even so, to reach 100%, I needed to tweak a few details:

- enable the `Strict-Transport-Security` header;
- configure the canonical tag;
- review links with `target="_blank"` to ensure `rel="noopener"`;
- remove small items that Lighthouse considered insecure or inconsistent.

These configurations aren't glamorous, but they are part of the finishing work of a site that aims to be trustworthy.

## Third step: SEO

The third step was the most important for the goal of showing up better in search engines.

SEO was also the most labor-intensive part. The interesting thing is that the previous steps already helped indirectly: accessibility, alternative text, and semantic structure impact both people and search engines.

To improve the score, I focused on a few things:

- distributing relevant keywords in important tags like `h1`, `title`, and meta description;
- configuring social media meta tags with Open Graph;
- adding structured data with JSON-LD;
- writing a concise meta description;
- ensuring a canonical tag to avoid URL ambiguity.

After these adjustments, the 100 in SEO finally came.

## What I took away from this process

This study was small but important. It helped me see performance, accessibility, SEO, and best practices as parts of the same effort: delivering a clearer, more findable, safer, and easier-to-use page.

Today, at whoisclebs.com, a lot has changed compared to the old clebson.cc. But the concern remains the same: keeping a simple, well-structured foundation that's ready to evolve.

## Reference

- Original article on Medium: https://medium.com/@clebson/estudo-de-caso-no-lighthouse-para-clebson-cc-991e4c0e1918
