-- Petot content seed for Supabase
-- Safe to run repeatedly. Requires apps/api/database/schema.sql first.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS faqs_category_question_key
  ON faqs (category, question);
CREATE UNIQUE INDEX IF NOT EXISTS pricing_tiers_name_key
  ON pricing_tiers (name);

INSERT INTO projects
  (slug, title, status, tagline, challenge, solution, image_url, hero_url,
   ratio, live_url, tags, media, meta, stats, image_thumbnail_url,
   hero_thumbnail_url, media_thumbnail_urls)
VALUES
('lezza', 'LEZZA DMS', 'published', E'National scale.\nZero shortcuts.',
 E'Ten provinces.\nOne system.\nLive in weeks.',
 E'Built for the people\nwho run it every day.',
 'https://cdn.sanity.io/images/degpnzrx/production/08e554af79798c7ce09316be88c0d296ace9ce4a-2250x1500.jpg?w=1440&q=90&auto=format',
 'https://cdn.sanity.io/images/degpnzrx/production/3eb0c775074a5912b27bed04b34be1f700094704-1440x897.gif?w=1440&h=897&q=90&fit=crop&auto=format',
 '2250 / 1500', 'View Live',
 ARRAY['[ENTERPRISE]', '[FMCG]'],
 ARRAY[
  'https://cdn.sanity.io/images/degpnzrx/production/98be69c3bcd9a811847bc088ccedb075f3367ab9-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/06a63be8f5de3314a9d7e064b031c52b66deff28-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/abdacca83ace68d868968a29e78a52d09d3d8ace-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/7f8eb34bad7242a1def1844bb956226a59c31ddb-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/ef93308571bbf986e2f1c895fc0b78c3f63204ca-3000x2250.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/0b86d1c446ea3b5c3afdfcaa067abd0ed417297f-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format'
 ],
 '{"Timeline":"2026 — Present","Category":"Enterprise | FMCG","Techstack":"Next.js | TypeScript | Zustand | React Query","Scope":"National — 10+ Provinces","Client":"PT Ramaputra Foods"}'::jsonb,
 '[{"value":10,"suffix":"+","label":"PROVINCES LIVE"},{"value":6,"suffix":"","label":"CORE MODULES BUILT"},{"value":0,"suffix":"","label":"CRITICAL ISSUES SHIPPED"}]'::jsonb,
 'https://cdn.sanity.io/images/degpnzrx/production/08e554af79798c7ce09316be88c0d296ace9ce4a-2250x1500.jpg?w=1440&q=90&auto=format',
 'https://cdn.sanity.io/images/degpnzrx/production/3eb0c775074a5912b27bed04b34be1f700094704-1440x897.gif?w=1440&h=897&q=90&fit=crop&auto=format',
 ARRAY[
  'https://cdn.sanity.io/images/degpnzrx/production/98be69c3bcd9a811847bc088ccedb075f3367ab9-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/06a63be8f5de3314a9d7e064b031c52b66deff28-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/abdacca83ace68d868968a29e78a52d09d3d8ace-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/7f8eb34bad7242a1def1844bb956226a59c31ddb-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/ef93308571bbf986e2f1c895fc0b78c3f63204ca-3000x2250.jpg?w=1440&q=90&fit=crop&auto=format',
  'https://cdn.sanity.io/images/degpnzrx/production/0b86d1c446ea3b5c3afdfcaa067abd0ed417297f-2250x1500.jpg?w=1440&q=90&fit=crop&auto=format'
 ]),
('ark-linux', 'ARK LINUX', 'published', NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/4a67c5fddb677d52f4c76ec3e7a52d2861adc898-3462x2550.jpg?w=1440&q=90&auto=format', NULL, '3462 / 2550', NULL,
 ARRAY['[OPEN SOURCE]', '[LINUX]'], NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/4a67c5fddb677d52f4c76ec3e7a52d2861adc898-3462x2550.jpg?w=1440&q=90&auto=format', NULL, NULL),
('baturraden-trailrun', 'BATURRADEN TRAILRUN', 'published', NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/5d302071b3ef530f3de3528f9f1d3a9678e0643c-3000x2250.jpg?w=1440&q=90&auto=format', NULL, '3000 / 2250', NULL,
 ARRAY['[WEB APP]', '[SPORTS]'], NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/5d302071b3ef530f3de3528f9f1d3a9678e0643c-3000x2250.jpg?w=1440&q=90&auto=format', NULL, NULL),
('capybara-captcha', 'CAPYBARA CAPTCHA', 'published', NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/aaf4d81f4ba2322d94bfd8a2f87981244ade97c1-3000x2250.jpg?w=1440&q=90&auto=format', NULL, '3000 / 2250', NULL,
 ARRAY['[OPEN SOURCE]', '[PRIVACY]'], NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/aaf4d81f4ba2322d94bfd8a2f87981244ade97c1-3000x2250.jpg?w=1440&q=90&auto=format', NULL, NULL),
('dropit', 'DROPIT', 'published', NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/c9edd2b90aef8b6fd589a5e71b0425bbb3a50879-3000x2000.jpg?w=1440&q=90&auto=format', NULL, '3000 / 2000', NULL,
 ARRAY['[OPEN SOURCE]', '[P2P]'], NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/c9edd2b90aef8b6fd589a5e71b0425bbb3a50879-3000x2000.jpg?w=1440&q=90&auto=format', NULL, NULL),
('weshortlink', 'WESHORTLINK', 'published', NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/98be69c3bcd9a811847bc088ccedb075f3367ab9-2250x1500.jpg?w=1440&q=90&auto=format', NULL, '2250 / 1500', NULL,
 ARRAY['[OPEN SOURCE]', '[SAAS]'], NULL, NULL, NULL,
 'https://cdn.sanity.io/images/degpnzrx/production/98be69c3bcd9a811847bc088ccedb075f3367ab9-2250x1500.jpg?w=1440&q=90&auto=format', NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
 title=EXCLUDED.title, status=EXCLUDED.status, tagline=EXCLUDED.tagline,
 challenge=EXCLUDED.challenge, solution=EXCLUDED.solution, image_url=EXCLUDED.image_url,
 hero_url=EXCLUDED.hero_url, ratio=EXCLUDED.ratio, live_url=EXCLUDED.live_url,
 tags=EXCLUDED.tags, media=EXCLUDED.media, meta=EXCLUDED.meta, stats=EXCLUDED.stats,
 image_thumbnail_url=EXCLUDED.image_thumbnail_url,
 hero_thumbnail_url=EXCLUDED.hero_thumbnail_url,
 media_thumbnail_urls=EXCLUDED.media_thumbnail_urls;

INSERT INTO faqs (category, question, answer, order_index) VALUES
('home','DO YOU WORK ON DESIGN AS WELL AS CODE?','Yes — and it''s not a separate service. Five years in graphic design and UI means the design thinking is already in the code. Component states, spacing systems, interaction design: that''s all part of the build, not on top of it.',1),
('home','WHAT''S YOUR TYPICAL TIMELINE?','Four to eight weeks for a fixed-scope build. Longer for enterprise systems or multi-surface work. I''ll give you a specific number before you commit to anything.',2),
('home','DO YOU WORK REMOTELY?','Always. Based in South Jakarta, working async-first with clients across time zones. Communication is in English.',3),
('home','WHAT STACK DO YOU BUILD WITH?','React and Next.js for most builds. TypeScript always. Tailwind CSS, Zustand or React Query depending on the shape of the data layer. I''ll use what fits the project — not just what I happen to know.',4),
('home','CAN YOU JOIN AN EXISTING CODEBASE?','Yes. I''m comfortable picking up an unfamiliar codebase, understanding the architecture, and contributing without breaking things. Happy to do a paid audit first if the codebase is large.',5),
('home','WHAT HAPPENS AFTER LAUNCH?','Depends on what you need. The Keep is a monthly retainer for ongoing work. For fixed-scope builds I''m available for a brief support period, handover documentation, and future engagements if the work fits.',6),
('pricing','WHY DON''T YOU LIST RATES ON THE PAGE?','Because scope determines cost, not the other way around. I''d rather give you an accurate number after a 30-minute call than a ballpark that turns into a negotiation.',1),
('pricing','WHAT''S THE DIFFERENCE BETWEEN THE BUILD AND THE KEEP?','The Build is fixed scope, fixed price, fixed timeline — you know exactly what you''re getting before we start. The Keep is an ongoing monthly retainer for products that need continuous development after launch.',2),
('pricing','DO YOU DO DESIGN AS WELL AS CODE?','Yes, and it''s built in. I handle design decisions as part of the frontend build — spacing systems, interaction states, component architecture. You don''t need a separate designer unless you need brand strategy or original illustration work.',3),
('pricing','WHAT''S INCLUDED IN A BUILD?','Custom frontend code, motion and interaction design, design system implementation, CMS integration, and Core Web Vitals on launch day. Everything on the Services list below is included by default.',4),
('pricing','WHAT IF MY PROJECT DOESN''T FIT A TIER?','Use the Quoted option. Enterprise systems, multi-team engagements, and open source work don''t fit neatly into fixed tiers — we scope it together and I give you a number before anything starts.',5),
('pricing','HOW LONG DOES A PROJECT TAKE?','The Build runs four to eight weeks. The Keep is rolling monthly. Quoted engagements are scoped per project — I''ll give you a specific timeline before we start, not a range.',6),
('pricing','HOW DO PAYMENTS WORK?','50% upfront, 50% on delivery for fixed-scope builds. Monthly retainers are billed at the start of each month. No hidden fees, no hourly tracking, no invoice surprises.',7)
ON CONFLICT (category, question) DO UPDATE SET answer=EXCLUDED.answer, order_index=EXCLUDED.order_index;

INSERT INTO pricing_tiers (name, basis, for_desc, items, order_index) VALUES
('THE BUILD','Fixed scope','YOU HAVE A BRIEF. YOU HAVE A LAUNCH DATE.',ARRAY['Custom frontend build, end to end','Motion and interaction design','Design system implementation','CMS integration and content modelling','Core Web Vitals on launch day'],1),
('THE KEEP','Monthly retainer','YOUR PRODUCT KEEPS GROWING AFTER LAUNCH.',ARRAY['Everything in The Build','Ongoing development and iteration','Priority async communication','Monthly code and performance reviews'],2),
('QUOTED','Per engagement','IT DOESN''T FIT A FIXED SHAPE. LET''S TALK.',ARRAY['Enterprise systems and distribution platforms','Multi-surface or multi-team work','Open source tools and community infrastructure','Scoped per engagement'],3)
ON CONFLICT (name) DO UPDATE SET basis=EXCLUDED.basis, for_desc=EXCLUDED.for_desc, items=EXCLUDED.items, order_index=EXCLUDED.order_index;

INSERT INTO site_settings (key, value) VALUES
('hero_image', '"https://cdn.sanity.io/images/degpnzrx/production/c7863541ce386e0b47397f3f7aec355f0f0368c6-1600x2400.heif?rect=0,134,1600,2133&w=1440&h=1920&q=90&fit=crop&auto=format"'),
('about_image', '"https://cdn.sanity.io/images/degpnzrx/production/09005d40e970c195f21fefb2f10367d03bbf7be9-2400x1600.heif?w=1920&h=1280&q=90&fit=crop&auto=format"'),
('zam_image', '"https://cdn.sanity.io/images/degpnzrx/production/93d0bb5fed50caf1672314711bdb102a339fde4a-1600x2400.heif?w=1440&h=2160&q=90&fit=crop&auto=format"'),
('process_images', '["https://8dfey87h01.ufs.sh/f/6hwVb6MrYw0cXfS2B1JmiMPZLlKkAj3uda0Q1N5gOyRhW4Sw","https://8dfey87h01.ufs.sh/f/6hwVb6MrYw0clF65hnSPN5vEwXU8Yzqs2Ma1lmdukjt9yKie","https://8dfey87h01.ufs.sh/f/6hwVb6MrYw0c1YoZux6Bybkexg83npJMoYVSUt06cGXv5I9m","https://8dfey87h01.ufs.sh/f/6hwVb6MrYw0cLTCECEyZtafNs6wISMG0v5TxW47FE9Vehgud"]'),
('process', '[{"n":"01","title":"Brief me.","body":"One message is enough. What are you building and what does it need to do? I''ll reply within two working days."},{"n":"02","title":"One call.","body":"30 minutes. You bring the problem — I bring the scope, the timeline, and the number. No commitment required."},{"n":"03","title":"Build.","body":"Custom code. Every component, every state, every animation written from scratch. No templates standing in for products."},{"n":"04","title":"Ship.","body":"On time. Core Web Vitals on launch day. Handover docs included. No disappearing after the invoice."}]'),
('build_items', '[{"title":"CUSTOM CODE.","body":"No templates. No Webflow. Built from scratch so the product isn''t constrained by the platform underneath it."},{"title":"DESIGN THINKING BUILT IN.","body":"Five years in graphic design and UI don''t stop at the Figma handover. They''re in the component structure, the spacing system, the state handling."},{"title":"SYSTEMS THAT HOLD.","body":"Reusable, documented, and built for the team that comes after. Architecture is part of the deliverable, not a separate engagement."},{"title":"PERFORMANCE AS STANDARD.","body":"Core Web Vitals on launch day — not on the post-launch audit. Performance is how the components are written, not what gets fixed afterwards."},{"title":"ONE ENGINEER. FULL OWNERSHIP.","body":"The person you brief is the one writing the code. One point of contact. One point of accountability."},{"title":"OPEN SOURCE BY HABIT.","body":"Ark Linux. Capybara Captcha. Dropit. WeShortlink. I build in public where I can, and I maintain what I ship."}]'),
('services', '["Custom frontend build, end to end","Motion and interaction design","Design system implementation and documentation","CMS integration and content modelling","Performance optimisation — Core Web Vitals on launch day","Deployment pipeline setup — Docker, Vercel, Cloudflare, AWS EC2"]'),
('engagements', '[["The Build","Four to eight weeks"],["The Keep","Rolling monthly"],["Quoted","Scoped per engagement"]]'),
('how_we_work', '["One message is enough to get going. [literally one.] I''ll reply within two working days with whether it''s worth a call.","You talk to me. I write the code. That''s the whole chain — no account managers, no juniors learning on your project, no telephone.","I say no to things. [fairly often.] Work I can''t fully stand behind doesn''t get a yes. Everything that does gets my full attention.","The design background isn''t a past life. It''s why the edge states are handled and the spacing holds at every breakpoint.","I flag problems I wasn''t asked about. [the ones you haven''t noticed are usually the expensive ones.]","Flat pricing. No hourly tracking, no estimates that balloon, no invoice surprises at the end of the month.","Performance ships on day one. Core Web Vitals aren''t an afterthought — they''re how the components are built.","Some of what I build is public. [Ark Linux. Capybara Captcha. Dropit. WeShortlink.] I document what I ship."]'),
('stats', '[{"prefix":"","value":50,"suffix":"+","label":"PROJECTS SHIPPED"},{"prefix":"","value":5,"suffix":"+","label":"YEARS IN PRODUCTION"},{"prefix":"","value":20,"suffix":"+","label":"BRANDS SERVED"}]'),
('brands', '["baturradentrailrun","ellsamikom","eraspace","horizondroid","komodoos","lipice","skinfood"]'),
('contact_links', '[{"label":"hi@zamkara.uk","href":"mailto:hi@zamkara.uk"},{"label":"GitHub: @zamkara","href":"https://github.com/zamkara"},{"label":"LinkedIn: @zamkara","href":"https://linkedin.com/in/zamkara"},{"label":"Telegram: @zamkara","href":"https://t.me/zamkara"}]'),
('nav', '[{"label":"Home","to":"/"},{"label":"Work","to":"/work"},{"label":"Services","to":"/pricing"},{"label":"About","to":"/about"},{"label":"Contact","to":"/contact"}]')
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value;

COMMIT;
