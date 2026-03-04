import { Question } from "@/types";

export const questionPool: Question[] = [
  // ===== 自己紹介 =====
  {
    id: 1,
    category: "self-introduction",
    text: "自己紹介をお願いいたします。職務経歴を時系列に沿って簡潔にお話しください。",
    zundamonText:
      "まずは自己紹介をお願いするのだ！これまでの経歴を時系列で簡潔に教えてほしいのだ！",
  },
  {
    id: 2,
    category: "self-introduction",
    text: "これまでの業務内容について、直近の案件を中心に教えてください。",
    zundamonText:
      "これまでの業務内容を教えてほしいのだ！特に直近の案件について詳しく聞きたいのだ！",
  },
  {
    id: 3,
    category: "self-introduction",
    text: "エンジニアを志したきっかけと、これまでのキャリアの歩みを教えてください。",
    zundamonText:
      "エンジニアになりたいと思ったきっかけと、これまでのキャリアを教えてほしいのだ！",
  },

  // ===== 転職理由 =====
  {
    id: 4,
    category: "career-change",
    text: "転職を考えた理由を教えてください。",
    zundamonText:
      "転職を考えた理由を教えてほしいのだ！結論から話してほしいのだ！",
  },
  {
    id: 5,
    category: "career-change",
    text: "現職（前職）を選んだ理由と、そこから転職を決意した経緯を教えてください。",
    zundamonText:
      "今の会社を選んだ理由と、転職を決めたきっかけを教えてほしいのだ！",
  },
  {
    id: 6,
    category: "career-change",
    text: "転職をして叶えたいことと、その先にどうなりたいかを教えてください。",
    zundamonText:
      "転職で叶えたいことと、その先の目標を教えてほしいのだ！",
  },

  // ===== 志望理由 =====
  {
    id: 7,
    category: "motivation",
    text: "この会社を志望した理由を教えてください。業界・企業・職種の観点を踏まえてお答えください。",
    zundamonText:
      "なんでこの会社を受けようと思ったのだ？業界・企業・職種の観点で教えてほしいのだ！",
  },
  {
    id: 8,
    category: "motivation",
    text: "他社ではなく弊社を選んだ理由、他社との違いをどのように捉えていますか？",
    zundamonText:
      "他の会社じゃなくてここを選んだ理由を教えてほしいのだ！何が違うと思ったのだ？",
  },

  // ===== キャリアプラン・転職の軸 =====
  {
    id: 9,
    category: "career-plan",
    text: "将来のキャリアプランを教えてください。3年後・5年後・10年後にどうなりたいですか？",
    zundamonText:
      "将来のキャリアプランを教えてほしいのだ！3年後、5年後、10年後にどうなりたいのだ？",
  },
  {
    id: 10,
    category: "career-plan",
    text: "転職活動における企業選びの軸を教えてください。",
    zundamonText:
      "転職で企業を選ぶときの軸を教えてほしいのだ！何を重視しているのだ？",
  },
  {
    id: 11,
    category: "career-plan",
    text: "今後伸ばしていきたいスキルや、挑戦したい技術領域はありますか？",
    zundamonText:
      "これから伸ばしたいスキルや挑戦したい技術はあるのだ？教えてほしいのだ！",
  },

  // ===== 成功体験・失敗体験 =====
  {
    id: 12,
    category: "experience",
    text: "これまでの仕事で最も成功したと思う体験を教えてください。その成功を再現するためにはどうすれば良いと思いますか？",
    zundamonText:
      "これまでで一番の成功体験を教えてほしいのだ！またその成功を再現するにはどうしたらいいか教えてほしいのだ！",
  },
  {
    id: 13,
    category: "experience",
    text: "仕事上の失敗体験を教えてください。失敗の原因と、それを繰り返さないためにどう改善しましたか？",
    zundamonText:
      "仕事で失敗した経験を教えてほしいのだ！原因と、どう改善したかも聞きたいのだ！",
  },
  {
    id: 14,
    category: "experience",
    text: "困難な技術的課題に直面した経験と、どのように乗り越えたか教えてください。",
    zundamonText:
      "難しい技術的な課題にぶつかった経験と、どう乗り越えたか教えてほしいのだ！",
  },

  // ===== 強み・弱み =====
  {
    id: 15,
    category: "strengths",
    text: "あなたの強みを教えてください。それを仕事でどのように活かしてきましたか？具体的なエピソードも交えてください。",
    zundamonText:
      "あなたの強みを教えてほしいのだ！具体的にどう活かしてきたか、エピソードも聞きたいのだ！",
  },
  {
    id: 16,
    category: "strengths",
    text: "あなたの弱みや課題を教えてください。それに対してどのように向き合い、改善に取り組んでいますか？",
    zundamonText:
      "自分の弱みや課題を教えてほしいのだ！どう改善しようとしているかも聞きたいのだ！",
  },
  {
    id: 17,
    category: "strengths",
    text: "自己PRをお願いします。即戦力としてどのように貢献できるか教えてください。",
    zundamonText:
      "自己PRをお願いするのだ！入社したらどう活躍できるか教えてほしいのだ！",
  },

  // ===== 技術知識 =====
  {
    id: 18,
    category: "technical",
    text: "最近使用した技術スタックについて説明してください。",
    zundamonText:
      "最近使った技術スタックについて教えてほしいのだ！どんな技術を使っているのだ？",
  },
  {
    id: 19,
    category: "technical",
    text: "TypeScriptの型システムの利点について説明してください。",
    zundamonText:
      "TypeScriptの型システムの良いところを説明してほしいのだ！",
  },
  {
    id: 20,
    category: "technical",
    text: "RESTful APIとGraphQLの違いと、それぞれの適したユースケースを教えてください。",
    zundamonText:
      "RESTful APIとGraphQLの違いを教えてほしいのだ！どんな時にどっちを使うのだ？",
  },
  {
    id: 21,
    category: "technical",
    text: "Gitでのブランチ戦略について、あなたが推奨する方法を教えてください。",
    zundamonText:
      "Gitのブランチ戦略について、おすすめの方法を教えてほしいのだ！",
  },
  {
    id: 22,
    category: "technical",
    text: "テスト駆動開発（TDD）についての考えと実践経験を教えてください。",
    zundamonText:
      "テスト駆動開発、TDDについてどう思っているか教えてほしいのだ！実際にやったことはあるのだ？",
  },
  {
    id: 23,
    category: "technical",
    text: "マイクロサービスアーキテクチャの利点と欠点を説明してください。",
    zundamonText:
      "マイクロサービスアーキテクチャの良いところと悪いところを教えてほしいのだ！",
  },
  {
    id: 24,
    category: "technical",
    text: "スケーラブルなシステムを設計する際に重要なポイントは何ですか？",
    zundamonText:
      "スケーラブルなシステムを作るとき、大事なポイントは何なのだ？教えてほしいのだ！",
  },
  {
    id: 25,
    category: "technical",
    text: "データベース設計で気をつけていることを教えてください。",
    zundamonText:
      "データベースを設計するとき、気をつけていることを教えてほしいのだ！",
  },

  // ===== 逆質問 =====
  {
    id: 26,
    category: "reverse",
    text: "最後に、何か質問はありますか？",
    zundamonText:
      "最後に、何か聞きたいことはあるのだ？なんでも聞いていいのだ！",
  },
  {
    id: 27,
    category: "reverse",
    text: "入社後に取り組みたいことや、確認しておきたいことはありますか？",
    zundamonText:
      "入社したらやりたいことや、確認しておきたいことはあるのだ？",
  },
];

/**
 * 質問プールから指定数の質問をバランスよく選択する
 * 基礎質問（自己紹介〜強み弱み）を優先し、技術・逆質問も混ぜる
 */
export function selectQuestions(count: number): Question[] {
  const categoryOrder: Question["category"][] = [
    "self-introduction",
    "career-change",
    "motivation",
    "career-plan",
    "experience",
    "strengths",
    "technical",
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
