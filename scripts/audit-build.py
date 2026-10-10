from pathlib import Path
from html.parser import HTMLParser
import re,json
class Page(HTMLParser):
 def __init__(self):super().__init__();self.metadata={};self.canonical=[];self.links=[];self.h1=0;self.skip=0;self.text=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='meta':self.metadata[a.get('name',a.get('property',''))]=a.get('content','')
  if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a.get('href',''))
  if tag=='a':self.links.append(a.get('href',''))
  if tag=='h1':self.h1+=1
  if tag in ['script','style']:self.skip+=1
 def handle_endtag(self,tag):
  if tag in ['script','style']:self.skip=max(0,self.skip-1)
 def handle_data(self,text):
  if not self.skip:self.text.append(text)
root=Path('dist');files=list(root.rglob('index.html'));assert len(files)==46,len(files)
for f in files:
 p=Page();p.feed(f.read_text());assert len(p.canonical)==1,f
 for key in ['description','og:title','og:description','og:url','og:image','twitter:card']:assert p.metadata.get(key),(f,key)
 assert 'example.com' not in f.read_text(),f
 assert 'V20' not in ''.join(p.text),f
 for href in p.links:
  if href.startswith('/') and not href.startswith('//'):
   path=href.split('?')[0].split('#')[0]
   assert (root/path.lstrip('/')/'index.html').exists() or (root/path.lstrip('/')).exists(),(f,href)
 if '/tools/' not in str(f) and '/editor/' not in str(f) and '/tool/' not in str(f):assert p.h1>=1,f
 assert p.metadata['og:image'].endswith('/og-image.png')
print(f'PASS: {len(files)} pre-rendered routes, static SEO/share tags, real content and internal link destinations.')
print('PASS: no public version badge or example.com placeholder in page HTML.')
