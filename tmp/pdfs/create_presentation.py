from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, white
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader

ROOT = Path('/Users/heberleonard/Documents/softwarehouse/abamev')
TMP = ROOT / 'tmp/pdfs'
SHOTS = TMP / 'screenshots'
OUT = ROOT / 'output/pdf/apresentacao-home-abamev.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
FONTS = Path('/System/Library/Fonts/Supplemental')
for name, filename in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Display','Georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONTS / filename)))

W,H = 1000,625
GREEN='#173f35'; DARK='#0d2720'; TEXT='#33433b'; MUTED='#5a6a62'; CREAM='#f6f4ec'; GOLD='#b08a45'
c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
c.setTitle('ABAMEV - Apresentação da página inicial')
c.setAuthor('Apresentação para aprovação visual')

def crop(name, source, box):
    im=Image.open(SHOTS/source)
    result=im.crop(box).convert('RGB')
    p=TMP/f'{name}.jpg';result.save(p,quality=94);return p

desktop=Image.open(SHOTS/'desktop-full.jpg')
dw,dh=desktop.size
print('Desktop',desktop.size,'Mobile',Image.open(SHOTS/'mobile-full.jpg').size)
assets={
 'opening':crop('opening','desktop-full.jpg',(0,0,dw,790)),
 'hero':crop('hero','desktop-full.jpg',(32,238,dw-32,774)),
 'institutional':crop('institutional','slide-2.jpg',(32,238,dw-32,774)),
 'menu':crop('menu','menu-desktop.jpg',(0,0,Image.open(SHOTS/'menu-desktop.jpg').width,530)),
 'access':crop('access','desktop-full.jpg',(20,800,dw-20,1248)),
 'publications':crop('publications','desktop-full.jpg',(20,1330,dw-20,1990)),
 'reading':crop('reading','reading-loaded.jpg',(20,2070,dw-20,2490)),
 'news':crop('news','desktop-full.jpg',(20,2560,dw-20,3110)),
 'videos':crop('videos','desktop-full.jpg',(20,3285,dw-20,3750)),
 'footer':crop('footer','desktop-full.jpg',(0,3845,dw,dh)),
 'mobile':crop('mobile','mobile-clean.jpg',(0,0,375,844)),
 'mobile-reading':crop('mobile-reading','mobile-reading-loaded.jpg',(0,3710,375,4394)),
 'mobile-menu':SHOTS/'mobile-menu.jpg',
}

def rect(x,y,w,h,fill):
    c.setFillColor(HexColor(fill));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def text(value,x,y,size=18,font='Body',color=TEXT):
    c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,H-y-size,value)
def para(value,x,y,w,size=18,color=TEXT,font='Body',leading=None):
    style=ParagraphStyle('p',fontName=font,fontSize=size,leading=leading or size*1.45,textColor=HexColor(color))
    p=Paragraph(value,style);_,h=p.wrap(w,H);p.drawOn(c,x,H-y-h);return h
def pic(path,x,y,w,h=None):
    im=Image.open(path)
    if h is None:h=w*im.height/im.width
    c.drawImage(ImageReader(im),x,H-y-h,width=w,height=h,mask='auto')
    return h
def base(num,title=None,dark=False):
    rect(0,0,W,H,DARK if dark else '#ffffff')
    text('ABAMEV',48,23,11,'Bold','#dccb9c' if dark else GREEN)
    text('APRESENTAÇÃO DA PÁGINA INICIAL',134,24,10,color='#cfdcd2' if dark else MUTED)
    text(f'{num:02d}',928,583,11,color='#cfdcd2' if dark else MUTED)
    if title:text(title,48,64,33,'Display','#ffffff' if dark else GREEN)
def end():c.showPage()

# 1. Abertura
base(1,dark=True)
pic(ROOT/'public/images/brands/abamev.png',48,83,75,76)
para('Página inicial<br/>do novo site',48,194,290,39,'#ffffff','Display',47)
para('Academia Baiana de<br/>Medicina Veterinária',48,314,285,19,'#d6dfce')
para('Proposta visual para aprovação',48,457,280,15,'#dccb9c')
text('Novembro de 2026',48,542,12,color='#cfdcd2')
pic(assets['opening'],370,110,590)
end()

# 2. Identidade
base(2,'Cores e fontes')
para('A identidade do site acompanha as cores do brasão da Academia.',48,120,870,18)
for i,(color,label,desc) in enumerate([
    (GREEN,'Verde','Cabeçalho e destaques'),(GOLD,'Dourado','Detalhes e identidade'),
    (CREAM,'Tons claros','Áreas de leitura'),('#ffffff','Branco','Respiro entre conteúdos')]):
    x=48+i*235
    rect(x,177,216,68,color)
    if color=='#ffffff':
        c.setStrokeColor(HexColor('#e3e7df'));c.rect(x,H-177-68,216,68,fill=0,stroke=1)
    text(label,x,258,19,'Bold',GREEN)
    para(desc,x,288,215,15)
para('Fraunces',48,379,415,29,GREEN,'Display')
para('Nos títulos, a fonte com pequenos acabamentos nas letras aproxima o visual de livros e publicações da Academia.',48,427,415,17)
text('Plus Jakarta Sans',535,382,25,'Bold',GREEN)
para('Nos textos e menus, as letras mais simples ajudam a ler e a encontrar os caminhos do site.',535,427,415,17)
end()

# 3. Menu
base(3,'Um menu organizado por assunto')
para('A marca recebe o visitante. Logo abaixo, o menu reúne as principais áreas da Academia e o acesso à busca.',48,118,900,18)
pic(assets['menu'],100,175,800)
end()

# 4. Carrossel
base(4,'Destaques na abertura')
para('O carrossel alterna cinco apresentações. As setas e os pontos permitem escolher o que ver.',48,120,890,18)
pic(assets['hero'],48,188,565)
pic(assets['institutional'],48,455,260)
para('Hans Merkt',652,191,300,23,GREEN,'Display')
para('O retrato e o texto apresentam sua contribuição à Medicina Veterinária e levam ao conteúdo completo.',652,235,285,17)
para('Também no carrossel',652,356,285,23,GREEN,'Display')
para('Marcas institucionais, Instituto Biológico da Bahia, Capelo e as primeiras vacinas do mundo ampliam os temas da abertura.',652,402,285,17)
para('Cada destaque usa imagens e títulos próprios.',340,470,245,15)
end()

# 5. Academia
base(5,'Acesso direto à Academia')
para('Três chamadas apresentam a instituição e conduzem às informações mais procuradas.',48,120,880,18)
pic(assets['access'],48,185,904)
para('Nossa história',48,539,270,18,GREEN,'Bold')
para('Documentos institucionais',361,539,285,18,GREEN,'Bold')
para('Cadeiras e patronos',680,539,270,18,GREEN,'Bold')
end()

# 6. Publicações
base(6,'Publicações')
para('Uma seleção do acervo',48,144,230,25,GREEN,'Display')
para('Os cartões mostram o título, o tipo de material e uma breve apresentação quando disponível.',48,218,230,18)
para('O visitante pode abrir um documento, ler um artigo ou consultar todas as publicações.',48,367,230,18)
pic(assets['publications'],318,145,634)
end()

# 7. Leituras
base(7,'Leituras em destaque')
para('Capas e retratos dão visibilidade aos materiais selecionados para leitura.',48,120,880,18)
pic(assets['reading'],48,188,904)
para('Livro sobre a cooperação Brasil-Alemanha',48,519,430,18,GREEN,'Bold')
para('Biografia de Milton Thiago de Mello',535,519,417,18,GREEN,'Bold')
end()

# 8. Notícias
base(8,'Notícias da Academia')
para('Uma lista fácil de percorrer',48,149,235,25,GREEN,'Display')
para('As datas, os títulos e os resumos ajudam o visitante a escolher o que deseja conhecer.',48,233,235,18)
para('A chamada “Ver todas as notícias” abre a relação completa.',48,372,235,18)
pic(assets['news'],318,155,634)
end()

# 9. Vídeos e footer
base(9,'Vídeos e informações no fim da página')
pic(assets['videos'],365,144,587)
para('Vídeos e palestras',48,145,270,25,GREEN,'Display')
para('Uma área própria reúne os encontros e as apresentações disponíveis para assistir.',48,193,265,17)
pic(assets['footer'],365,385,587)
para('Rodapé',48,401,265,25,GREEN,'Display')
para('Os principais caminhos aparecem novamente, junto ao canal do YouTube e às informações institucionais.',48,449,265,17)
end()

# 10. Textos e imagens
base(10,'Textos e imagens com contexto')
pic(ROOT/'public/media/hans-merkt-cutout.webp',48,174,215)
para('Conteúdo ligado à Academia',330,143,610,26,GREEN,'Display')
para('Os textos institucionais do cabeçalho partem do Estatuto. O rodapé utiliza um trecho de fala pública sobre a ABAMEV, publicada pelo <a href="https://www.crmvba.org.br/tag/abamev/" color="#173f35">CRMV-BA</a>.',330,195,610,19)
para('As imagens apresentam pessoas, documentos e acontecimentos relacionados ao acervo. Na home, capas e retratos ajudam a identificar cada leitura.',330,310,610,19)
para('A revisão pode considerar nomes, legendas, textos e a escolha dos materiais em destaque.',330,436,610,19)
text('Retrato utilizado no destaque de Hans Merkt',48,530,12,color=MUTED)
end()

# 11. Mobile
base(11,'A mesma home no celular')
para('O conteúdo se reorganiza para a tela pequena. Os blocos aparecem um abaixo do outro, e o menu fica em um botão no topo.',48,137,235,19)
para('Os destaques também podem ser percorridos com o toque na tela.',48,333,235,19)
for path,x,label in [(assets['mobile'],330,'Abertura'),(assets['mobile-reading'],542,'Leituras'),(assets['mobile-menu'],754,'Menu')]:
    if label == 'Leituras':
        pic(path,x,174,190)
    else:
        pic(path,x,139,190,422)
    text(label,x,570,14,'Bold',GREEN)
end()

# 12. Aprovação
base(12,'O que avaliar nesta proposta',dark=True)
para('A página inicial está pronta para sua avaliação visual.',48,137,570,25,'#ffffff','Display')
for n,(title,desc) in enumerate([
    ('Identidade','Cores, fontes e apresentação do brasão.'),
    ('Conteúdo','Textos, fotografias e materiais em destaque.'),
    ('Organização','Ordem das seções e nomes do menu.'),
    ('Celular','Tamanho das letras e disposição dos conteúdos.')]):
    y=220+n*74
    text(title,48,y,19,'Bold','#dccb9c');para(desc,220,y,410,17,'#d6dfce')
pic(assets['mobile'],720,125,175,394)
para('Depois desta revisão, um vídeo mostrará a navegação e as interações do site.',48,545,620,16,'#d6dfce')
end()
c.save()
print(OUT)
