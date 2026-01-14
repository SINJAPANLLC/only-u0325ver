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

function PrivacyContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h2 className="text-xl font-bold text-gray-900 mb-4">プライバシーポリシー</h2>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第1条（総則）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">ウェブサービスである「Only-U」（以下「本サービス」といいます。）を運営する合同会社SIN JAPAN KANAGAWA（以下「当社」といいます。）は、本サービスのユーザー（以下「ユーザー」という）のプライバシーを尊重し、ユーザーの個人情報およびその他のユーザーのプライバシーに係る情報（以下「プライバシー情報」といいます。）の管理に細心の注意を払います。</li>
        <li className="mb-2">当社は、個人情報保護法をはじめとする各法令およびその他の規範を遵守してユーザーから収集した個人情報を適切に取り扱います。また、当社は、個人情報を取り扱う体制の強化、SSL技術の導入等、ユーザーの個人情報の取り扱いについて、継続的な改善を図っています。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第2条（本ポリシーへの同意、同意の撤回）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">ユーザーは、問い合わせ又は会員登録を通じて当社に自身のプライバシー情報を提供する場合、本ポリシーを熟読し、その内容に同意するものとします。</li>
        <li className="mb-2">ユーザーは、当社によるプライバシー情報の使用等について同意を撤回することができます。この場合、本サービスを継続利用することはできません。</li>
        <li className="mb-2">本条の本ポリシーへの同意および同意の撤回は、それぞれ当社が定める手段にてなされるものとします。</li>
        <li className="mb-2">当社は、クッキー、IPアドレス、アクセスログ等のWEBトラッキング技術を活用してユーザーの行動や嗜好に関する情報を収集します。当社は、ユーザーが本サービスを利用した場合、当該ユーザーが当社によるこれらの技術を利用したプライバシー情報の収集について同意したものとみなします。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第3条（収集するプライバシー情報）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">当社は、本サービスの提供に際して、ユーザーから以下の情報を収集または取得します。
          <ul className="list-disc ml-6 mt-2">
            <li>(1)ユーザーがフォーム等に入力することにより提供する情報：これには氏名、問い合わせ等に関する情報、メールアドレス、年齢または生年月日等が含まれます。</li>
            <li>(2)クッキー、IPアドレス、アクセスログ等のWEBトラッキング技術、アクセス解析ツール等を介して当社がユーザーから収集する情報：これには利用端末やOS、ブラウザ等の接続環境に関する情報、ユーザーの行動履歴や閲覧履歴等に関する情報、購入した商品や閲覧した商品等のユーザーの嗜好に関する情報およびクッキー情報が含まれます。</li>
          </ul>
        </li>
        <li className="mb-2">当社は、適法かつ公正な手段によってプライバシー情報を入手し、ユーザーの意思に反する不正な入手をしません。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第4条（プライバシー情報の利用目的）</h4>
      <p className="mb-2">当社は、ユーザーから収集したプライバシー情報を本サービスの運営の目的のために使用します。主な利用目的は、以下のとおりです。</p>
      <ul className="list-disc ml-6 mb-4">
        <li>(1)料金請求、本人確認、認証のため</li>
        <li>(2)本人確認のため</li>
        <li>(3)ユーザー投稿コンテンツの決済のため</li>
        <li>(4)売上金の振込のため</li>
        <li>(5)利用規約やポリシーの変更等の重要な通知を送信するため</li>
        <li>(6)本サービスのコンテンツやサービスの内容や品質の向上に役立てるため</li>
        <li>(7)アンケート、懸賞、キャンペーン等の実施のため</li>
        <li>(8)マーケティング調査、統計、分析のため</li>
        <li>(9)システムメンテナンス、不具合対応のため</li>
        <li>(10)広告の配信およびその成果確認のため</li>
        <li>(11)技術サポートの提供、お客様からの問い合わせ対応のため</li>
        <li>(12)ターゲットを絞った当社または第三者の商品またはサービスの広告の開発、提供のため</li>
        <li>(13)不正行為または違法となる可能性のある行為を防止するため</li>
        <li>(14)クレーム、紛争・訴訟等の対応のため</li>
      </ul>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第5条（プライバシー情報の第三者提供）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">当社は、ユーザーの個人情報を第三者に開示または提供する場合、その提供先・提供情報内容を開示し、ユーザー本人の同意を得るものとします。なお、当社は、以下の場合を除き、ユーザー本人の事前の同意を得ることなく、個人情報を第三者に開示または提供することはありません。
          <ul className="list-disc ml-6 mt-2">
            <li>(1)法令等の定めに基づいて開示等を請求された場合</li>
            <li>(2)弁護士、検察、警察等から捜査に必要な範囲で開示等を請求された場合</li>
            <li>(3)当社の関連会社間で情報を共有する場合</li>
            <li>(4)本サービスの提供に必要な範囲で第三者に業務の一部を委託する場合</li>
            <li>(5)本サービスの提供に必要な範囲内で決済代行会社に情報を提供する必要がある場合</li>
          </ul>
        </li>
        <li className="mb-2">当社は、個人情報の取り扱いを第三者に委託する場合、個人情報保護法に従って、委託先に対する必要かつ適切な監督を行います。</li>
        <li className="mb-2">当社は、合併や分割等で当社の事業を第三者に譲渡する場合または本サービスの一部または全部を第三者に譲渡する場合、本サービスに係るユーザーの個人情報等を当該第三者に提供します。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第6条（プライバシー情報の管理、保管期間）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">当社は、ユーザーが本サービスを利用している期間中、当該ユーザーから開示または提供されたプライバシー情報の漏洩、改ざん等を防止するため、現時点での技術水準に合わせた必要かつ適切な安全管理措置を講じます。</li>
        <li className="mb-2">当社は、当社が保管するプライバシー情報を利用する必要がなくなった場合、当該プライバシー情報を遅滞なく消去するよう努めるものとします。また、ユーザーよりプライバシー情報の削除を要求された場合も、同様とします。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第7条（ユーザーによる照会等への対応）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">ユーザーは、当社に対して、当社が保有する自身のプライバシー情報の開示、訂正、追加または削除、および利用停止を請求することができます。</li>
        <li className="mb-2">ユーザーは、当社が定める手段によって前項の開示等の請求をするものとします。なお、同請求は、ユーザー本人、法定代理人（ユーザーが未成年者または成年被後見人である場合）または当該請求につきユーザー本人より委任された代理人のみすることができます。</li>
        <li className="mb-2">当社は、開示等の請求を受けた場合、当社が定める手段によって本人確認したうえで、相当な期間内にこれに対応します。なお、当社は、法令に基づき開示等をしない決定をした場合、その旨をユーザーに通知するものとします。</li>
        <li className="mb-2">ユーザーは、プライバシー情報の開示等に際して、以下に定める手数料を支払わなければなりません。<br />
          開示、照会、追加、訂正および削除請求にかかる手数料額：５００円＋送料<br />
          ※原則的に簡易書留（送料３９２円）にて発送します。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第8条（解析ツール等の使用）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">当社は、アクセス解析ツールを使用してユーザーの行動履歴等に関する情報を収集します。また、本サービスの提供に係るウェブサイト上に掲載される広告等の一部は、クッキーを利用した第三者の運営するサービスを利用して表示されます。なお、Googleが提供するサービスについては、Googleのプライバシーポリシーが適用されます。<br />
          <a href="https://policies.google.com/privacy?hl=ja" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy?hl=ja</a></li>
        <li className="mb-2">ユーザーは、1)自身のブラウザ設定等からクッキーを無効にする、2)それぞれの解析ツール、行動ターゲティング広告システムに係るWEBページからオプトアウトする、等の手段により当社によるプライバシー情報の収集を拒否するまたは行動ターゲティング広告を非表示にすることができます。</li>
        <li className="mb-2">前項の設定の変更等は、ユーザー自身の自己責任にてなされるものとし、当社は、設定を変更したこと等により一部の情報が閲覧できない等、ユーザーに損害が生じた場合でも、一切責任を負わないものとします。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第9条（本ポリシーの変更）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">当社は、自身の判断にて、本ポリシーを改定することができます。当社は、本ポリシーを改定する場合、緊急性がある場合を除き、事前に当社が適当であると判断する手段にてユーザーにその旨を通知するものとします。</li>
        <li className="mb-2">本ポリシーの改定は、改定後のプライバシーポリシーを本サービスにかかるWEBサイト上に掲載した時点で効力を生じるものとします。</li>
        <li className="mb-2">ユーザーは、本ポリシーの改定に同意することができない場合、当社に対して、第７条に定める手段にて自身のプライバシー情報の削除を要求することができます。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第10条（合意管轄、準拠法）</h4>
      <ol className="list-decimal ml-6 mb-4">
        <li className="mb-2">本ポリシーは、日本国法に準拠して解釈されるものとします。</li>
        <li className="mb-2">ユーザーは、本ポリシーに関連して紛争等が発生した場合、東京地方裁判所において第一審の裁判を行うことにあらかじめ同意するものとします。</li>
      </ol>

      <h4 className="text-base font-bold text-gray-900 mt-4 mb-2">第11条（管理責任者）</h4>
      <p className="mb-4">
        当社では、個人情報の管理責任者を以下の者として、個人情報の適正な管理および個人情報保護に関する施策の継続的な改善を実施しています。なお、個人情報に関するお問い合わせ、ご相談、第７条の開示等の請求の窓口もこちらをご利用ください。
      </p>
      <div className="ml-4 mb-4">
        <p>運営者: 合同会社SIN JAPAN KANAGAWA</p>
        <p>窓口となる部署: 個人情報担当窓口</p>
        <p>メールアドレス: kanagawa@sinjapan.jp</p>
        <p>開示等の請求の方法: メール、郵送</p>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">最終更新日: 2025年10月10日</p>
        <p className="text-sm text-gray-500">本ポリシーに関するご質問は、kanagawa@sinjapan.jp までご連絡ください。</p>
      </div>
    </div>
  );
}

function LegalNoticeContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h2 className="text-xl font-bold text-gray-900 mb-6">特定商取引法に基づく表記</h2>

      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900 w-1/3">販売業者</td>
            <td className="py-3">合同会社SIN JAPAN KANAGAWA</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">運営統括責任者名</td>
            <td className="py-3">榎本翔太</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">所在地</td>
            <td className="py-3">神奈川県愛甲郡愛川町中津7287</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">電話番号</td>
            <td className="py-3">
              050-5526-9906<br />
              <span className="text-sm text-gray-500">※ お電話での対応は行っておりません。<br />お急ぎの際は問い合わせフォームからお願いいたします。</span>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">連絡先メールアドレス</td>
            <td className="py-3">kanagawa@sinjapan.jp</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">ホームページ</td>
            <td className="py-3">
              <a href="https://only-u.fun" className="text-blue-600 hover:underline">https://only-u.fun</a>
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">販売価格</td>
            <td className="py-3">各商品ページの価格に準じます。</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">お支払い方法</td>
            <td className="py-3">クレジットカード</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">お支払期限</td>
            <td className="py-3">ご注文時にお支払い確定</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">商品の引き渡し時期</td>
            <td className="py-3">お支払い完了後、サービスの提供を行います。</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">返品・キャンセル</td>
            <td className="py-3">サービスの性質上、契約締結後のキャンセル、クーリングオフは一切認められず、お支払い頂いた料金については理由を問わず返還いたしません。</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">サービスの解約条件</td>
            <td className="py-3">解約される場合は、当社サイト上の記載に従って解約手続を行う必要があります。</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">その他費用</td>
            <td className="py-3">
              当社が代理受領した料金を「主催者」が指定する振込先口座に振り込む際、振込手数料として３３０円（税込）を当社にお支払いいただきます。<br /><br />
              なお、ご指定いただいた振込先口座情報の不備・誤記によって誤った振込先への振込がなされてしまった場合に、当社が任意で行う組戻し手続に際し、組戻し手数料として８８０円（税込）を当社にお支払いいただきます。
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">映像送信型性風俗特殊営業届出</td>
            <td className="py-3">神奈川県公安委員会第　号</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">無店舗型性風俗特殊営業届出</td>
            <td className="py-3">神奈川県公安委員会第　号</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-3 pr-4 font-medium text-gray-900">古物商許可</td>
            <td className="py-3">神奈川県公安委員会第　号</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function GuidelinesContent() {
  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <h2 className="text-xl font-bold text-gray-900 mb-6">掲載ガイドライン</h2>

      <h4 className="text-base font-bold text-gray-900 mt-6 mb-3">1. 禁止コンテンツ</h4>
      <p className="mb-2">以下のコンテンツは掲載を禁止します：</p>
      <ul className="list-disc ml-6 mb-4">
        <li>18歳未満の人物が関与するコンテンツ</li>
        <li>強制・脅迫・暴力を伴うコンテンツ</li>
        <li>動物との性的行為を描写するコンテンツ</li>
        <li>排泄物や血液を過度に描写するコンテンツ</li>
        <li>違法薬物の使用を推奨するコンテンツ</li>
        <li>自殺や自傷行為を助長するコンテンツ</li>
        <li>第三者の著作権を侵害するコンテンツ</li>
        <li>虚偽の情報や詐欺的なコンテンツ</li>
        <li>生成AIにより作成されたコンテンツ</li>
        <li>その他、弊社が不適切と判断したコンテンツ</li>
      </ul>

      <h4 className="text-base font-bold text-gray-900 mt-6 mb-3">2. 掲載要件</h4>
      <p className="mb-2">コンテンツを掲載する際は以下を遵守してください：</p>
      <ul className="list-disc ml-6 mb-4">
        <li>出演者の年齢確認書類の提出</li>
        <li>出演同意書の取得</li>
        <li>映像送信型性風俗特殊営業の届出</li>
        <li>適切なモザイク処理の実施</li>
        <li>正確な情報の提供</li>
        <li>プライバシーの保護</li>
      </ul>

      <h4 className="text-base font-bold text-gray-900 mt-6 mb-3">3. コンテンツの品質基準</h4>
      <ul className="list-disc ml-6 mb-4">
        <li>映像・音声の品質が良好であること</li>
        <li>適切な照明と撮影環境であること</li>
        <li>明確で理解しやすいタイトルと説明文</li>
        <li>適切なカテゴリ分類</li>
        <li>正確なタグ付け</li>
      </ul>

      <h4 className="text-base font-bold text-gray-900 mt-6 mb-3">4. コミュニケーションガイドライン</h4>
      <ul className="list-disc ml-6 mb-4">
        <li>相手を尊重した丁寧なコミュニケーション</li>
        <li>ハラスメント行為の禁止</li>
        <li>個人情報の適切な取り扱い</li>
        <li>スパム行為の禁止</li>
        <li>適切な言語の使用</li>
      </ul>

      <h4 className="text-base font-bold text-gray-900 mt-6 mb-3">5. 違反時の措置</h4>
      <p className="mb-2">ガイドライン違反が発覚した場合、以下の措置を講じます：</p>
      <ul className="list-disc ml-6 mb-4">
        <li>コンテンツの削除</li>
        <li>アカウントの一時停止</li>
        <li>アカウントの永久停止</li>
        <li>法的措置の検討</li>
      </ul>

      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          注意：本ガイドラインは、安全で適切なサービス提供のために定められています。
          全てのユーザーは本ガイドラインを遵守し、責任ある利用をお願いします。
          疑問点がございましたら、サポートまでお問い合わせください。
        </p>
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
  const renderContent = () => {
    switch (type) {
      case "terms":
        return <TermsContent />;
      case "privacy":
        return <PrivacyContent />;
      case "legal":
        return <LegalNoticeContent />;
      case "guidelines":
        return <GuidelinesContent />;
      default:
        return <PlaceholderContent />;
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-100">
        <Link href="/account">
          <button className="text-gray-600 hover:text-gray-800" data-testid={`button-close-${type}`}>
            <X className="h-6 w-6" />
          </button>
        </Link>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {renderContent()}
      </div>
    </div>
  );
}
