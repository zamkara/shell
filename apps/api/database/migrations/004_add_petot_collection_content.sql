BEGIN;

INSERT INTO site_settings (key, value) VALUES
(
  'build_grid_items',
  '[{"title":"RESEARCH & IDEATE.","body":"User interviews, competitive analysis, and hypothesis formation before a line of code."},{"title":"DESIGN & BUILD.","body":"Rapid prototyping with design tokens and component systems, custom-coded from scratch."},{"title":"TEST & VALIDATE.","body":"User testing, metrics analysis, and iteration planning — the work earns its ship date."},{"title":"SYSTEMS THINKING.","body":"Design tokens and components that scale across platforms and products."},{"title":"EDITORIAL CRAFT.","body":"Typography, layout, and visual hierarchy with print-quality precision."},{"title":"CODE-AWARE DESIGN.","body":"Designs that translate seamlessly into production-ready code."}]'::jsonb
),
(
  'legal_links',
  '[{"label":"Privacy Policy","href":"/privacy"},{"label":"Legal Notice","href":"/disclaimer"}]'::jsonb
),
(
  'seo',
  '{"title":"zamkara — Frontend Engineer","description":"Frontend Engineer with a design background. Custom code, motion as the medium, building from South Jakarta for clients worldwide.","author":"zamkara","siteName":"zamkara"}'::jsonb
),
(
  'site_copy',
  $copy${"home":{"eyebrow":"ALMATERA INCUBATOR","headline":["Most devs stop","when the code works.","I don't."],"intro":"Five years drawing things. Five years building them. The obsession didn't change — just the tools. South Jakarta, for anyone, anywhere.","briefLabel":"SEND A BRIEF","approachLabel":"THE APPROACH","faqLabel":"FAQ","ctaEyebrow":"ENOUGH TALK. LET'S BUILD.","ctaHeadline":["Brief me once.","Get the thing","you imagined."],"ctaLinkLabel":"SEND A BRIEF →","wordmark":"ALMATERA"},"featuredWork":{"toc":"Featured work","label":"SELECTED WORK","title":"Selected work.","description":"Enterprise systems, open source tools and design work. The work travels.","viewAllLabel":"VIEW ALL","viewProjectLabel":"VIEW"},"process":{"toc":"Process","label":"THE WORKFLOWS","title":"How I work.","scrollHint":"Scroll to move →"},"build":{"toc":"The build","label":"THE BUILD","title":"How the work holds.","standard":"EVERY BUILD, THE SAME STANDARD."},"work":{"toc":"Selected work","title":"SELECTED WORK","projectsLabel":"Projects","viewProjectLabel":"VIEW PROJECT →","caseStudyLabel":"CASE STUDY","challengesLabel":"THE CHALLENGES","solutionLabel":"THE SOLUTION","nextLabel":"Next case"},"about":{"toc":"About","label":"ABOUT","title":"One engineer. No middlemen.","imageAlt":"zamkara","profileName":"zamkara","profileRole":"frontend engineer — south jakarta","paragraphs":["I'm zamkara — a Frontend Engineer based in South Jakarta. Started in graphic design. Moved into UI. Wrote my first production component and never looked back.","These days I'm building enterprise distribution systems for national FMCG networks, and shipping open source tools on the side. [Ark Linux. Capybara Captcha. Dropit.] Computer Science, Amikom Purwokerto, 2025.","I work alone. That's the point."],"howToc":"How I work","howLabel":"HOW I WORK","githubLabel":"GITHUB ACTIVITY","listeningLabel":"LISTENING"},"pricing":{"toc":"Services","label":"SERVICES","title":"Pick a shape. Ship the work.","intro":"No rates on the page — scope determines cost. One call to get the number right, before you commit to anything.","briefLabel":"SEND A BRIEF","includedLabel":"What's included","includedTitle":"What's in the build.","engagementsLabel":"ENGAGEMENTS","faqLabel":"FAQ"},"contact":{"toc":"Contact","label":"CONTACT","title":["One message.","That's all it takes."],"intro":"Tell me what you're building. I'll reply within 48 hours with whether it's a fit — and if it is, we'll set up a 30-minute call to scope the work. No commitment required.","availability":"OPEN TO NEW WORK.","response":"RESPONSE WITHIN 48 HOURS. [USUALLY LESS.]","location":"SOUTH JAKARTA — WORKING GLOBALLY"},"footer":{"logoAlt":"Almatera","about":"Almatera's a product of a whole ass product cooked up in the Tera Incubator straight up supervised and followin' every rule I've laid down just to shut up all the copium addicts wonderin' 'bout me.","message":"Send me a message and we'll get back to you as soon as possible.","copyrightName":"Almatera. All Rights Reserved.","newsletterTitle":"DON'T MISS FUTURE UPDATES.","namePlaceholder":"Name","emailPlaceholder":"Email","subscribeLabel":"Subscribe","marquee":"Turn chaos into order for more chaos .","motto":["Sei dunkel im Licht","Sei hell in der Dunkelheit"]}}$copy$::jsonb
),
(
  'integrations',
  '{"githubUsername":"zamkara","lastfmUsername":"zamkara"}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
