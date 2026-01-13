import { X } from "lucide-react";
import { Link } from "wouter";
import logoImage from "@assets/IMG_9769_1768108334555.PNG";

interface LegalPageProps {
  title: string;
  type: "terms" | "privacy" | "legal" | "guidelines";
}

function TermsContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Only-U[オンリーユー]利用規約</h2>
      <p className="mb-4">
        合同会社SIN JAPAN KANAGAWA（以下「弊社」といいます。）は、弊社が運営するウェブサイト及び弊社が運営するファンクラブサイトの提供サービスの利用について、以下のとおり規約（以下「本規約」といいます。）を定めます。本規約は、弊社とすべての利用者との間に適用されます。
      </p>

      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3">第１章 総則</h3>
      
      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第１条（定義）</h4>
      <p className="mb-2">本規約では、以下のとおり用語を定義します。</p>
      
      <div className="ml-4 mb-4">
        <p className="mb-2"><strong>「本サイト」</strong><br />
        弊社が運営する以下のURL配下のウェブサイトをいいます。但し、URLは弊社の都合により変更する場合があります。<br />
        https://only-u.fun</p>
        
        <p className="mb-2"><strong>「利用者」</strong><br />
        本サイトを利用する個人をいいます。</p>
        
        <p className="mb-2"><strong>「本サービス」</strong><br />
        弊社が運営するファンクラブサイトの提供サービスをいいます。詳細は本規約第２章及び本サイト上で定めます。</p>
        
        <p className="mb-2"><strong>「会員」</strong><br />
        本規約第２条に定める会員登録手続きを完了した利用者をいい、主催者と参加者で構成されます。</p>
        
        <p className="mb-2"><strong>「主催者」</strong><br />
        映像送信型性風俗特殊営業（風俗営業等の規制及び業務の適正化等に関する法律第２条第８項）の届出を行い、本規約第２条に定める会員登録手続きを完了した利用者のうち、ファンクラブサイトの運営者として登録手続きを完了した個人の総称をいいます。</p>
        
        <p className="mb-2"><strong>「参加者」</strong><br />
        本規約第２条に定める会員登録手続きを完了した利用者のうち、ファンクラブサイトにおいて主催者が提供するサービスを利用する者として登録手続きを完了した個人の総称をいいます。</p>
        
        <p className="mb-2"><strong>「コンテンツ」</strong><br />
        主催者が参加者に提供する活動情報や日常のプライベートに関する動画、静止画、テキスト、コミュニケーションサービス等のデジタル情報をいいます。</p>
        
        <p className="mb-2"><strong>「ファンクラブサイト」</strong><br />
        主催者が参加者に向けて各種コンテンツを発信できるウェブサイトをいいます。</p>
        
        <p className="mb-2"><strong>「ファンクラブサイト利用契約」</strong><br />
        参加者が各ファンクラブサイトの利用を申し込み、主催者の承諾を得た場合に、主催者と参加者との間で締結される契約をいいます。</p>
        
        <p className="mb-2"><strong>「ファンクラブ会費」</strong><br />
        ファンクラブサイト利用契約に基づいて発生する参加者が主催者に対し支払う費用をいいます。</p>
        
        <p className="mb-2"><strong>「本システム」</strong><br />
        本サイト及び本サービスを運営・稼動するために弊社が使用するハードウェア及びソフトウェアの総称をいいます。</p>
        
        <p className="mb-2"><strong>「本規約等」</strong><br />
        本規約、プライバシーポリシー及び本サイト上で弊社が定めた本サービス利用のための諸条件の総称をいいます。</p>
        
        <p className="mb-2"><strong>「本契約」</strong><br />
        本規約等に基づく弊社と利用者との契約をいいます。</p>
      </div>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第２条（会員登録）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">本サービスの会員登録手続きは、必ず利用者本人が行うものとします。未成年者（２０２２年４月１日以後は、１８歳に満たない者をいいます。）は、本サービスをご利用いただけません。</li>
        <li className="mb-2">会員登録を希望する者（以下「会員登録希望者」といいます。）は、本サイト上の会員登録画面において、弊社の定める必要事項を入力し送信することで会員登録手続きを行うものとし、弊社が、これを承諾する旨の通知（電子メール等）をした時点で、弊社が会員登録希望者を会員として承諾したものとみなします。</li>
        <li className="mb-2">会員登録希望者又は会員が次の各号のいずれか一つにでも該当する場合、弊社は前項の承諾を拒否し、又は承諾後に取り消すことができるものとします。
          <ul className="list-disc ml-6 mt-2">
            <li>本サイト上で入力した情報に、虚偽の記載、誤記、記入漏れがある場合</li>
            <li>実在しないことが判明した場合</li>
            <li>すでに登録済みであることが判明した場合</li>
            <li>過去において、本規約第２１条１項又は２項に基づく本サービスの利用停止や会員としての資格の取消処分を受けたことがある場合</li>
            <li>未成年者が会員登録手続きをした場合</li>
            <li>暴力団又はその構成員等の反社会的勢力であると弊社が判断した場合又は暴力団等の反社会的勢力と密接な関連性を有すると弊社が判断した場合</li>
            <li>その他、会員とすることが不適切であると弊社が判断した場合</li>
          </ul>
        </li>
        <li className="mb-2">会員登録希望者は、会員登録手続きを行う際に、主催者又は参加者のいずれかを選択して登録するものとします。</li>
        <li className="mb-2">主催者としての会員登録を希望する者は、当該会員登録申込により、映像送信型性風俗特殊営業の届出を行っていることについて、表明し保証するものとします。</li>
        <li className="mb-2">会員登録後に本条３項の各号に該当することが判明した場合、弊社は会員登録手続きを取り消した上、本サービスの利用を停止できるものとします。</li>
        <li className="mb-2">会員は本規約等に従うものとします。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第３条（会員情報の変更）</h4>
      <p className="mb-4">
        会員は、本規約第２条１項に基づく会員登録手続きの際に弊社に届け出た会員の氏名、所在地又は住所、電話番号、電子メールアドレス、その他の情報に変更又は訂正があった場合、速やかに弊社に通知するものとします。会員が会員情報の変更を通知していない場合又は遅滞した場合、これにより会員又は第三者に生じた一切の損害について弊社は責任を負いません。
      </p>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第４条（会員の地位承継）</h4>
      <p className="mb-4">
        会員が個人の場合、本契約上の会員としての地位は相続の対象とはならないものとします。但し、既に発生しているファンクラブ会費の支払い義務は、会員の死亡により相続されるものとします。
      </p>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第５条（利用者への通知）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">弊社が利用者（会員を含みます。）に対し通知を行う必要がある場合、本サイト上に掲示をして行うことができるものとします。この場合、利用者の閲覧可能な状態でサーバに掲示内容の情報が保存された時点で通知の効果が生じるものとします。</li>
        <li className="mb-2">弊社が会員に対し本サービスについて個別に通知を行う必要がある場合、当該会員が届け出た情報を利用して、弊社が適切と判断する方法により行うことができるものとします。これらの方法を採用した場合、弊社が当該会員に発信又は発送した時点で通知の効果が生じるものとします。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第６条（本規約等の変更）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">次の各号のいずれかに該当する場合、本規約等の変更をすることにより、変更後の本規約等の条項について合意があったものとみなし、弊社は個別に利用者と合意をすることなく本契約等の内容を変更することができるものとします。
          <ul className="list-disc ml-6 mt-2">
            <li>本規約等の変更が利用者の一般の利益に適合する場合</li>
            <li>本規約等の変更が本契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性、その他の変更に係る事情に照らして合理的なものである場合</li>
          </ul>
        </li>
        <li className="mb-2">弊社は、本規約等の変更をするときは、その効力発生時期を定め、かつ、本規約等を変更する旨及び変更後の本規約等の内容並びにその効力発生時期をインターネットの利用（本サイトの利用を含みます。）その他の適切な方法により周知するものとします。</li>
        <li className="mb-2">前項で定めた効力発生時期から変更後の本規約等が適用され、本契約の内容が変更されるものとします。</li>
      </ol>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">最終更新日: 2025年10月10日</p>
        <p className="text-sm text-gray-500">本規約に関するご質問は、kanagawa@sinjapan.jp までご連絡ください。</p>
      </div>
    </div>
  );
}

function PlaceholderContent() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <img 
        src={logoImage} 
        alt="Only-U" 
        className="h-20 object-contain mb-6"
      />
      <p className="text-gray-500 text-center">
        このページは準備中です
      </p>
    </div>
  );
}

export default function LegalPage({ title, type }: LegalPageProps) {
  return (
    <div className="min-h-full bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <Link href="/account">
          <button className="text-gray-600 hover:text-gray-800" data-testid={`button-close-${type}`}>
            <X className="h-6 w-6" />
          </button>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <div className="w-6" />
      </div>

      {type === "terms" ? (
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <TermsContent />
        </div>
      ) : (
        <PlaceholderContent />
      )}
    </div>
  );
}
