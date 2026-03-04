import { Question } from "@/types";

export const questionPool: Question[] = [
  // 自己紹介
  {
    id: 1,
    category: "self-introduction",
    text: "簡単に自己紹介と、これまでの経歴を教えてください。",
    zundamonText:
      "まずは自己紹介をお願いするのだ！これまでの経歴も教えてほしいのだ！",
  },
  {
    id: 2,
    category: "self-introduction",
    text: "エンジニアを志したきっかけは何ですか？",
    zundamonText:
      "エンジニアになりたいと思ったきっかけを教えてほしいのだ！",
  },
  {
    id: 3,
    category: "self-introduction",
    text: "あなたの強みと、それを活かした経験を教えてください。",
    zundamonText:
      "あなたの強みと、それを活かした経験を教えてほしいのだ！",
  },

  // 技術知識
  {
    id: 4,
    category: "technical",
    text: "最近使用した技術スタックについて説明してください。",
    zundamonText:
      "最近使った技術スタックについて教えてほしいのだ！どんな技術を使っているのだ？",
  },
  {
    id: 5,
    category: "technical",
    text: "TypeScriptの型システムの利点について説明してください。",
    zundamonText:
      "TypeScriptの型システムの良いところを説明してほしいのだ！",
  },
  {
    id: 6,
    category: "technical",
    text: "RESTful APIとGraphQLの違いと、それぞれの適したユースケースを教えてください。",
    zundamonText:
      "RESTful APIとGraphQLの違いを教えてほしいのだ！どんな時にどっちを使うのだ？",
  },
  {
    id: 7,
    category: "technical",
    text: "Gitでのブランチ戦略について、あなたが推奨する方法を教えてください。",
    zundamonText:
      "Gitのブランチ戦略について、おすすめの方法を教えてほしいのだ！",
  },
  {
    id: 8,
    category: "technical",
    text: "テスト駆動開発（TDD）についての考えと実践経験を教えてください。",
    zundamonText:
      "テスト駆動開発、TDDについてどう思っているか教えてほしいのだ！実際にやったことはあるのだ？",
  },

  // 設計・アーキテクチャ
  {
    id: 9,
    category: "architecture",
    text: "マイクロサービスアーキテクチャの利点と欠点を説明してください。",
    zundamonText:
      "マイクロサービスアーキテクチャの良いところと悪いところを教えてほしいのだ！",
  },
  {
    id: 10,
    category: "architecture",
    text: "スケーラブルなシステムを設計する際に重要なポイントは何ですか？",
    zundamonText:
      "スケーラブルなシステムを作るとき、大事なポイントは何なのだ？教えてほしいのだ！",
  },
  {
    id: 11,
    category: "architecture",
    text: "データベース設計で気をつけていることを教えてください。",
    zundamonText:
      "データベースを設計するとき、気をつけていることを教えてほしいのだ！",
  },

  // 行動面接
  {
    id: 12,
    category: "behavioral",
    text: "チームで意見が対立した際に、どのように解決しましたか？",
    zundamonText:
      "チームで意見がぶつかったとき、どうやって解決したか教えてほしいのだ！",
  },
  {
    id: 13,
    category: "behavioral",
    text: "困難な技術的課題に直面した経験と、どう乗り越えたか教えてください。",
    zundamonText:
      "難しい技術的な問題にぶつかった経験と、どう乗り越えたか教えてほしいのだ！",
  },
  {
    id: 14,
    category: "behavioral",
    text: "締め切りに間に合わないと感じた時、どのように対処しましたか？",
    zundamonText:
      "締め切りに間に合わないかもって思ったとき、どうしたか教えてほしいのだ！",
  },
  {
    id: 15,
    category: "behavioral",
    text: "これまでで最も成長を感じたプロジェクトについて教えてください。",
    zundamonText:
      "一番成長できたと思うプロジェクトについて教えてほしいのだ！",
  },

  // 逆質問
  {
    id: 16,
    category: "reverse",
    text: "最後に、何か質問はありますか？",
    zundamonText:
      "最後に、何か聞きたいことはあるのだ？なんでも聞いていいのだ！",
  },
  {
    id: 17,
    category: "reverse",
    text: "今後のキャリアプランについて教えてください。",
    zundamonText:
      "これからのキャリアプランを教えてほしいのだ！どんなエンジニアになりたいのだ？",
  },
];

/**
 * 質問プールから指定数の質問をバランスよく選択する
 */
export function selectQuestions(count: number): Question[] {
  const categoryOrder: Question["category"][] = [
    "self-introduction",
    "technical",
    "architecture",
    "behavioral",
    "reverse",
  ];

  const byCategory = new Map<string, Question[]>();
  for (const q of questionPool) {
    const list = byCategory.get(q.category) ?? [];
    list.push(q);
    byCategory.set(q.category, list);
  }

  // 各カテゴリからシャッフルして取得
  for (const [cat, list] of byCategory) {
    byCategory.set(cat, shuffleArray(list));
  }

  const selected: Question[] = [];
  let catIndex = 0;

  while (selected.length < count) {
    const cat = categoryOrder[catIndex % categoryOrder.length];
    const pool = byCategory.get(cat);
    if (pool && pool.length > 0) {
      selected.push(pool.shift()!);
    }
    catIndex++;

    // 全カテゴリが枯渇したら終了
    const totalRemaining = Array.from(byCategory.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    if (totalRemaining === 0) break;
  }

  return selected;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
