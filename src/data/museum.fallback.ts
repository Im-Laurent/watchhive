import type { MuseumPiece } from './types';

// scripts/export_to_site.py 가 생성한다. 직접 고치지 말 것 —
// 원본은 명화 프로젝트의 artworks.json + watches.json + pairings.json 이다.
// public/museum.json 을 못 읽을 때 이 목록으로 떨어진다.
export const FALLBACK_MUSEUM: MuseumPiece[] = [
  {
    "id": "comedian-submariner",
    "alt": "코미디언 — 롤렉스 서브마리너 5513를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/comedian-submariner-full",
        "w": 1600,
        "h": 893
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/comedian-submariner-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/comedian-submariner-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Maurizio Cattelan",
      "meta": "Italian, b. 1960",
      "title": "Comedian, 2019",
      "medium": "Banana and duct tape, Edition of 3, private collections",
      "watch": "Fitted with Rolex Submariner 5513, 1962–1989"
    },
    "ko": {
      "artist": "마우리치오 카텔란",
      "meta": "이탈리아, 1960년생",
      "title": "코미디언, 2019년",
      "medium": "바나나와 덕트 테이프, 에디션 3점, 개인 소장",
      "watch": "착용 롤렉스 서브마리너 5513, 1962–1989년"
    },
    "spec": "40mm 스틸 오이스터 · 자동 cal. 1530 → 1520 · 1962–1989년 생산. 27년간 만들어져 롤렉스에서 가장 장수한 레퍼런스 중 하나다. 형제인 5512 와 달리 크로노미터 인증을 받지 않았고, 그 대신 대중적인 가격으로 보급되어 다이버 워치의 기준점 노릇을 오래 했다. 날짜창이 없어 다이얼이 좌우로 완벽하게 대칭이며, 삼분할 원이 달린 메르세데스 시침과 12시 삼각형 인덱스, 60분 눈금 회전 베젤이 식별점이다. 초기 광택 길트 다이얼이 뒤에 무광으로 바뀐다. 영국 해군 납품용 밀서브(MilSub)와 〈007 죽느냐 사느냐〉의 톱니 베젤 개체가 모두 이 계보에서 나왔다.",
    "credit": "AI 합성 · 마우리치오 카텔란 〈코미디언〉(2019)에 부치는 오마주 — 원작을 촬영하거나 복제한 것이 아니라 그 몸짓을 빌려 새로 만든 이미지입니다. 이 한 점만 저작권이 살아 있는 작품을 참조합니다."
  },
  {
    "id": "adam-santos",
    "alt": "아담의 창조 — 까르띠에 산토스 뒤몽 엑스트라 플랫를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/adam-santos-full",
        "w": 1600,
        "h": 712
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/adam-santos-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/adam-santos-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Michelangelo Buonarroti",
      "meta": "Italian, 1475–1564",
      "title": "The Creation of Adam, c. 1512",
      "medium": "Fresco, Sistine Chapel Ceiling, Vatican City",
      "watch": "Fitted with Cartier Santos-Dumont Extra-Flat, 1980–1989"
    },
    "ko": {
      "artist": "미켈란젤로 부오나로티",
      "meta": "이탈리아, 1475–1564",
      "title": "아담의 창조, 1512년경",
      "medium": "프레스코, 바티칸 시스티나 성당 천장",
      "watch": "착용 까르띠에 산토스 뒤몽 엑스트라 플랫, 1980–1989년"
    },
    "spec": "사각 케이스 27×36mm · 옐로 골드 · 수동 Piguet cal. 21 베이스 · 1980–1989년 (Ref. W1505453). 1904년 루이 까르띠에가 비행사 알베르토 산토스 뒤몽을 위해 만든 최초의 파일럿 워치를 1980년대에 얇게 다시 만든 판이다. 조종 중에 회중시계를 꺼낼 수 없다는 하소연에서 나온 이 계보가 손목시계를 여성의 장신구에서 남성의 실용품으로 옮겼다. 베젤에 그대로 드러난 나사 여덟 개, 블루 스틸 소검, 크라운의 사파이어 카보숑이 80년 가까이 이어진 식별점이다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (Public domain)"
  },
  {
    "id": "bodhisattva78-reverso",
    "alt": "금동미륵보살반가사유상 (국보 제78호) — 예거 르쿨트르 리베르소를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/bodhisattva78-reverso-full",
        "w": 893,
        "h": 1600
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/bodhisattva78-reverso-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/bodhisattva78-reverso-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Unknown",
      "meta": "Korean, Three Kingdoms period",
      "title": "Pensive Bodhisattva, 6th century",
      "medium": "Gilt bronze, National Museum of Korea, Seoul",
      "watch": "Fitted with Jaeger-LeCoultre Reverso, 1931"
    },
    "ko": {
      "artist": "작자 미상",
      "meta": "한국, 삼국시대",
      "title": "금동미륵보살반가사유상 (국보 제78호), 6세기",
      "medium": "금동, 국립중앙박물관",
      "watch": "착용 예거 르쿨트르 리베르소, 1931년"
    },
    "spec": "아르데코 직사각 케이스 21×39mm · 스틸 · 수동 (Ref. QVE65101). 인도 주둔 영국군 장교들이 폴로 경기 중 유리가 깨진다고 하소연하자, 받침대에서 케이스를 밀어 뒤집는 구조로 답한 시계다. 1931년 3월 르네알프레드 쇼보가 특허를 냈다. 케이스 위아래를 가로지르는 평행 홈 세 줄(가드룬)이 식별점이고, 이 개체는 서브다이얼 없는 검은 다이얼에 바 인덱스를 얹었다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (KOGL Type 1) · 사진 National Museum of Korea"
  },
  {
    "id": "bodhisattva83-explorer",
    "alt": "금동미륵보살반가사유상 (국보 제83호) — 롤렉스 익스플로러 1016를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/bodhisattva83-explorer-full",
        "w": 893,
        "h": 1600
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/bodhisattva83-explorer-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/bodhisattva83-explorer-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Unknown",
      "meta": "Korean, Three Kingdoms period",
      "title": "Pensive Bodhisattva, early 7th century",
      "medium": "Gilt bronze, National Museum of Korea, Seoul",
      "watch": "Fitted with Rolex Explorer 1016, 1963–1989"
    },
    "ko": {
      "artist": "작자 미상",
      "meta": "한국, 삼국시대",
      "title": "금동미륵보살반가사유상 (국보 제83호), 7세기 전반",
      "medium": "금동, 국립중앙박물관",
      "watch": "착용 롤렉스 익스플로러 1016, 1963–1989년"
    },
    "spec": "36mm 스틸 오이스터 · 자동 · 1963–1989년 생산. 1953년 에베레스트 초등과 함께 이름을 얻은 계보의 완성형으로, 26년간 거의 바뀌지 않고 만들어진 롤렉스에서 가장 장수한 레퍼런스 중 하나다. 눈금 없는 매끈한 베젤과 3·6·9 아라비아 숫자만 남긴 다이얼은 도구 시계 디자인의 정점으로 꼽힌다. 초기 길트 다이얼이 후기에 무광으로 바뀌었다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (KOGL Type 1) · 사진 국립중앙박물관(National Museum of Korea)"
  },
  {
    "id": "milkmaid-royaloak",
    "alt": "우유 따르는 여인 — 오데마 피게 로열 오크 5402 '점보'를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/milkmaid-royaloak-full",
        "w": 1472,
        "h": 1472
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/milkmaid-royaloak-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/milkmaid-royaloak-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Johannes Vermeer",
      "meta": "Dutch, 1632–1675",
      "title": "The Milkmaid, c. 1660",
      "medium": "Oil on canvas, Rijksmuseum, Amsterdam",
      "watch": "Fitted with Audemars Piguet Royal Oak 5402 'Jumbo', 1972"
    },
    "ko": {
      "artist": "요하네스 페르메이르",
      "meta": "네덜란드, 1632–1675",
      "title": "우유 따르는 여인, 1660년경",
      "medium": "캔버스에 유채, 암스테르담 국립미술관",
      "watch": "착용 오데마 피게 로열 오크 5402 '점보', 1972년"
    },
    "spec": "팔각 39mm 스틸 · 두께 7mm · 자동 cal. 2121(JLC 920 기반). 제랄드 젠타가 바젤 박람회 하루 전 밤에 그린 것으로 알려져 있다. 발매가 3,300 스위스프랑 — 당시 롤렉스 서브마리너의 약 열 배였다. 스틸에 금시계 값을 매긴 이 사건이 '럭셔리 스포츠 워치'라는 장르를 만들었다. 팔각 베젤의 육각 나사 여덟 개, 잔격자 타피스리 다이얼, 러그 없이 케이스에서 그대로 이어지는 브레이슬릿이 특징이며, 첫 2,000점이 A-시리즈다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (Public domain)"
  },
  {
    "id": "thinker-nautilus",
    "alt": "생각하는 사람 — 파텍 필립 노틸러스 3700를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/thinker-nautilus-full",
        "w": 1472,
        "h": 1472
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/thinker-nautilus-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/thinker-nautilus-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Auguste Rodin",
      "meta": "French, 1840–1917",
      "title": "The Thinker, modeled 1880, cast 1917",
      "medium": "Bronze, Cleveland Museum of Art",
      "watch": "Fitted with Patek Philippe Nautilus 3700/1, 1976"
    },
    "ko": {
      "artist": "오귀스트 로댕",
      "meta": "프랑스, 1840–1917",
      "title": "생각하는 사람, 1880년 원형, 1917년 주조",
      "medium": "청동, 클리블랜드 미술관",
      "watch": "착용 파텍 필립 노틸러스 3700, 1976년"
    },
    "spec": "둥근 팔각 42mm(귀 포함) 스틸 · 자동 cal. 28-255 C(JLC 920 기반) · 1976년. 역시 젠타의 설계이며, 광고 문구가 \"세계에서 가장 비싼 시계 중 하나가 스틸로 만들어졌다\"였다. 발매가 3,100달러로 지금 가치 약 1만 7천 달러다. 선박의 현창에서 따온 형태에 좌우로 경첩 모양 '귀'가 붙어 있고, 다이얼에는 가로줄이 촘촘히 엠보싱돼 있다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (CC0)"
  },
  {
    "id": "monalisa-tank",
    "alt": "모나리자 — 까르띠에 탱크 루이를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/monalisa-tank-full",
        "w": 1073,
        "h": 1600
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/monalisa-tank-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/monalisa-tank-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Leonardo da Vinci",
      "meta": "Italian, 1452–1519",
      "title": "Mona Lisa, c. 1503–1506",
      "medium": "Oil on poplar panel, Musée du Louvre, Paris",
      "watch": "Fitted with Cartier Tank Louis Cartier, 1973"
    },
    "ko": {
      "artist": "레오나르도 다 빈치",
      "meta": "이탈리아, 1452–1519",
      "title": "모나리자, 1503–1506년경",
      "medium": "포플러 패널에 유채, 파리 루브르 박물관",
      "watch": "착용 까르띠에 탱크 루이, 1973년"
    },
    "spec": "직사각 케이스 25.5×33.5mm · 옐로 골드 · 수동 (점보 Ref. 17011). 1917년 루이 까르띠에가 1차 대전 르노 FT 전차를 위에서 내려다본 형태에서 착안했고, 1922년 '탱크 루이 까르띠에'로 정제됐다. 케이스 양옆의 두꺼운 세로 브랑카르가 러그 없이 그대로 스트랩으로 이어지는 것이 이 모델의 핵심이다. 생산이 스위스로 넘어간 뒤로는 구성이 훨씬 정돈돼 처음으로 레퍼런스 번호가 붙었고, 이 다섯 개 레퍼런스는 모두 옐로 골드와 화이트 골드로 만들어졌다. 그중 가장 큰 것이 점보 17011 이다. 로마 숫자·블루 스틸 소검·사파이어 카보숑 크라운은 100년째 거의 그대로다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (Public domain)"
  },
  {
    "id": "tahiti-gmt",
    "alt": "타히티의 여인들 — 롤렉스 GMT-마스터 6542 '펩시'를 착용한 모습",
    "shots": [
      {
        "kind": "full",
        "label": "전체",
        "src": "/images/museum/tahiti-gmt-full",
        "w": 1600,
        "h": 1196
      },
      {
        "kind": "detail",
        "label": "시계 확대",
        "src": "/images/museum/tahiti-gmt-detail",
        "w": 1200,
        "h": 1200
      },
      {
        "kind": "watch",
        "label": "시계",
        "src": "/images/museum/tahiti-gmt-watch",
        "w": 1024,
        "h": 1024
      }
    ],
    "en": {
      "artist": "Paul Gauguin",
      "meta": "French, 1848–1903",
      "title": "Tahitian Women on the Beach, 1891",
      "medium": "Oil on canvas, Musée d'Orsay, Paris",
      "watch": "Fitted with Rolex GMT-Master 6542 'Pepsi', 1954"
    },
    "ko": {
      "artist": "폴 고갱",
      "meta": "프랑스, 1848–1903",
      "title": "타히티의 여인들, 1891년",
      "medium": "캔버스에 유채, 파리 오르세 미술관",
      "watch": "착용 롤렉스 GMT-마스터 6542 '펩시', 1954년"
    },
    "spec": "38mm 스틸 오이스터(러그 투 러그 48mm) · 자동 cal. 1030 · 1036 · 1065 · 1954년. 팬암이 대륙을 횡단하는 조종사를 위해 두 시간대를 한 다이얼에서 읽는 시계를 롤렉스에 요청하면서 태어난 GMT 계보의 첫 모델이다. 크라운 가드가 없는 것이 6542 를 알아보는 가장 확실한 표시로, 가드는 뒤를 이은 1675 부터 생긴다. 빨강·파랑 반반 베젤이 '펩시'라는 별명의 출처이고, 24시간 침으로 두 번째 시간대를 읽는다. 초기 베젤은 야광 숫자를 넣은 베이클라이트였는데 방사성 문제로 회수돼 알루미늄으로 바뀌었다.",
    "credit": "AI 합성 · 원본 Wikimedia Commons (Public domain)"
  }
];
