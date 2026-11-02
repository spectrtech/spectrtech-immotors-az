/* SpectrTech · st-editor.js — редактор сайта (mainedit.html).
   Режимы: сервер (api/index.php: PHP или Cloudflare) — вход по паролю, «Dərc et» публикует сразу;
   демо (нет API, например spectrtech.az/demo/...) — всё хранится только в этом браузере.
   Предпросмотр — iframe страницы с ?st_edit=1: страница берёт черновик из STE.draft(). */
(() => {
  'use strict';
  const CFG = window.ST_EDITOR;
  const SITE = CFG.site;
  const LANGS = CFG.langs;
  const API = 'api/index.php';
  const D = document, W = window;
  const $ = (id) => D.getElementById(id);

  /* ───────────── тексты интерфейса ───────────── */
  const U = {
    az: {
      inLangs: 'Üç dildə', apiBrokenT: 'Redaktorun server hissəsi işləmir', apiBrokenP: 'api/index.php cavab vermir. Hostinqdə PHP-nin aktiv olduğunu yoxlayın (quraşdırma təlimatına baxın).',
      loginSub: 'SpectrTech editor©', loginTitle: 'Redaktora giriş', password: 'Parol', showPw: 'Parolu göstər', remember: 'Bu cihazda 30 gün yadda saxla',
      signIn: 'Daxil ol', signingIn: 'Yoxlanılır…', badPw: 'Parol düzgün deyil.', tooMany: 'Çox sayda uğursuz cəhd. %1 dəqiqə sonra yenidən yoxlayın.',
      netErr: 'Serverlə əlaqə yoxdur. İnterneti yoxlayıb yenidən cəhd edin.', notConfT: 'Redaktor hələ quraşdırılmayıb',
      notConfP: 'Sayt administratoru ilkin parolu təyin etməlidir (quraşdırma təlimatına baxın).', loginFoot: 'Parolu unutmusunuzsa, saytı quraşdıran şəxsə müraciət edin.',
      editor: 'SpectrTech editor©', page: 'Səhifə', previewLang: 'Önbaxış dili', device: 'Ekran', desk: 'Kompüter', tab: 'Planşet', mob: 'Telefon',
      toolEdit: 'Redaktə', toolBrowse: 'Baxış', tool: 'Rejim',
      hintEdit: 'Dəyişmək istədiyiniz mətnə və ya şəklə toxunun. Qalereya, slayd və ya tabı açmaq üçün «Baxış» rejiminə keçin.',
      hintBrowse: 'Sayt adi qaydada işləyir: keçidlər, tablar, qalereya. Dəyişiklik etmək üçün «Redaktə»yə qayıdın.',
      publish: 'Dərc et', saveDemo: 'Yadda saxla', publishing: 'Dərc edilir…', published: 'Dərc edildi. Dəyişikliklər artıq saytdadır.',
      savedDemo: 'Yadda saxlanıldı — yalnız bu brauzerdə (demo).', discard: 'Ləğv et', discardQ: 'Dərc edilməmiş bütün dəyişikliklər silinsin?',
      discarded: 'Dəyişikliklər ləğv edildi.', pending: 'Dərc edilməyib: %1', pendingDemo: 'Saxlanmayıb: %1', allPub: 'Hamısı dərc edilib', allSaved: 'Hamısı yadda saxlanılıb',
      more: 'Digər', history: 'Tarixçə', changePw: 'Parolu dəyiş', logout: 'Çıxış', uiLang: 'Redaktorun dili', openSite: 'Səhifəni yeni pəncərədə aç', help: 'Necə işləyir',
      demoMode: 'Demo rejimi: dəyişikliklər yalnız bu brauzerdə saxlanılır, saytın ziyarətçiləri onları görmür.', demoBadge: 'Demo',
      resetDemo: 'Demo dəyişikliklərini sıfırla', resetDemoQ: 'Bu brauzerdə saxlanılan bütün demo dəyişiklikləri silinsin?', resetDone: 'Demo dəyişiklikləri silindi.',
      tabSel: 'Seçilən', tabTexts: 'Mətnlər', tabLists: 'Siyahılar', tabContacts: 'Əlaqə', tabHistory: 'Tarixçə',
      selEmptyT: 'Səhifədə bir elementə toxunun', selTip1: 'Mətn — üç dildə dəyişdirilir: AZ, RU, EN.', selTip2: 'Şəkil — yenisini yükləyin, ölçü avtomatik uyğunlaşır.',
      selTip3: 'Menyu, otaq, tur — bütün sahələri ilə açılır.', selTip4: 'Hazır olanda «Dərc et» düyməsini basın.',
      kText: 'Mətn', kHeading: 'Başlıq', kButton: 'Düymə', kLink: 'Keçid', kLabel: 'Forma sahəsi', kImage: 'Şəkil', kPhone: 'Telefon', kChoices: 'Seçim siyahısı', kList: 'Siyahı',
      changed: 'dəyişdirilib', revert: 'Əvvəlki mətnə qaytar', revertImg: 'Əvvəlki şəkli qaytar', revertVal: 'Əvvəlki kimi qaytar',
      sameAll: 'Bu mətn səhifədə %1 yerdə eynidir — hamısı birlikdə dəyişir.', generated: 'Bu mətn avtomatik yaranır (tarix, qiymət və ya say). Onu siyahıda dəyişin.',
      notEditable: 'Bu element redaktə olunmur: loqo və ya dizayn elementi.', imgChange: 'Şəkli dəyiş', imgUpload: 'Foto yüklə', uploading: 'Yüklənir…', imgRemove: 'Şəkli sil',
      imgTip: 'JPG və ya PNG, eni ən azı 1600 px. Şəkil avtomatik kiçildilir.', imgEverywhere: 'Bu şəkil saytın bütün səhifələrində dəyişəcək.',
      fileTooBig: 'Fayl çox böyükdür (ən çox %1 MB).', badImage: 'Fayl şəkil kimi açılmadı. JPG, PNG, WebP və ya GIF seçin.', uploadFailed: 'Şəkil yüklənmədi. Yenidən cəhd edin.',
      demoFull: 'Brauzerin demo yaddaşı doldu. Bəzi şəkilləri silin və ya demo dəyişikliklərini sıfırlayın.',
      add: 'Əlavə et', addPhoto: 'Foto əlavə et', up: 'Yuxarı', down: 'Aşağı', del: 'Sil', delQ: '«%1» silinsin?', minItems: 'Siyahıda ən azı %1 element qalmalıdır.',
      emptySlot: 'Boş yer', untitled: 'Adsız', photo: 'Foto', notSet: 'Göstərilməsin', listsEmpty: 'Bu səhifədə ayrıca siyahı yoxdur — mətnləri və şəkilləri birbaşa səhifədə dəyişin.',
      items: '%1 element', textsSearch: 'Mətn axtar', textsNone: 'Heç nə tapılmadı.', textsNote: 'Səhifənin bütün mətnləri, o cümlədən forma xəbərdarlıqları və WhatsApp mesajının mətni.',
      phones: 'Telefon nömrələri', phonesNote: 'Nömrəni dəyişsəniz, o, saytın bütün səhifələrində, zəng düymələrində və WhatsApp-da dəyişəcək.', newNumber: 'Yeni nömrə',
      noPhones: 'Bu səhifədə telefon nömrəsi yoxdur.', links: 'Xarici keçidlər', linksNote: 'Instagram, xəritə, rezervasiya və digər saytlara keçidlər. Dəyişiklik bütün saytda tətbiq olunur.',
      newLink: 'Yeni ünvan: https://…', badUrl: 'Ünvan https:// ilə başlamalıdır.', noLinks: 'Bu səhifədə xarici keçid yoxdur.', waBadge: 'WhatsApp',
      histNote: 'Hər dərc ayrıca saxlanılır. İstənilən köhnə versiyanı geri qaytarmaq olar.', histEmpty: 'Hələ dərc edilmiş versiya yoxdur.', histDemo: 'Demo rejimində versiyalar saxlanılmır.',
      restore: 'Geri qaytar', restoreQ: 'Saytı %1 tarixli versiyaya qaytarmaq? Bu versiya dərhal dərc olunacaq.', restored: 'Köhnə versiya geri qaytarıldı və dərc olundu.',
      current: 'indiki', version: 'Versiya %1', cancel: 'Ləğv et', yes: 'Bəli', close: 'Bağla', save: 'Saxla',
      pwT: 'Parolu dəyiş', pwForceT: 'Öz parolunuzu təyin edin', pwForceP: 'İlk girişdən sonra yeni parol təyin edin və onu heç kimə verməyin.',
      pwOld: 'Hazırkı parol', pwNew: 'Yeni parol (ən azı 8 simvol)', pwRep: 'Yeni parolu təkrarlayın', pwShort: 'Parol ən azı 8 simvol olmalıdır.', pwMismatch: 'Parollar eyni deyil.',
      pwChanged: 'Parol dəyişdirildi.', pwWrongOld: 'Hazırkı parol düzgün deyil.', sessionEnd: 'Sessiya bitdi. Yenidən daxil olun — dəyişiklikləriniz itməyib.',
      conflictT: 'Sayt başqa cihazdan dəyişdirilib', conflictP: 'Öz versiyanızı dərc etsəniz, həmin dəyişikliklər əvəz olunacaq.', conflictGo: 'Mənim versiyamı dərc et',
      draftFound: 'Dərc edilməmiş dəyişikliklər tapıldı (%1).', draftRestore: 'Bərpa et', draftDrop: 'Sil', loading: 'Yüklənir…', frameTitle: 'Səhifənin önbaxışı', panelL: 'Redaktə paneli',
      lineHint: 'Hər sətirdə bir bənd.', phoneHint: 'Hər sətirdə bir nömrə, məsələn +994 51 555 51 51.', azFallback: 'Boş qalsa, AZ mətni göstəriləcək',
      openItem: 'Bu elementin bütün sahələri', optional: 'istəyə görə', bold: 'Qalın', italic: 'Kursiv', link: 'Keçid', clearFmt: 'Formatı təmizlə', linkPrompt: 'Keçidin ünvanı (https://…)',
      choicesNote: 'Açılan siyahının variantları.', errGeneric: 'Xəta baş verdi. Yenidən cəhd edin.', tooLarge: 'Dəyişikliklər həcmcə çox böyükdür.', back: 'Geri',
      listOf: 'Siyahı: %1', saveFirst: 'Əvvəlcə dərc edin', inThisPage: 'Bu səhifədə', item: 'Element', remove: 'Sil', origPhoto: 'İndiki şəkil', newPhoto: 'Yeni şəkil',
      helpT: 'Redaktor necə işləyir', help1: '«Redaktə» rejimində səhifədəki mətnə və ya şəklə toxunun — sağda (telefonda aşağıda) redaktə paneli açılacaq.',
      help2: 'Mətnləri üç dildə dəyişin. Siyahılar (menyu, otaqlar, turlar) «Siyahılar» bölməsindədir.', help3: 'Telefon nömrələri və xarici keçidlər «Əlaqə» bölməsindədir.',
      help4: 'Dəyişikliklər əvvəlcə yalnız sizə görünür. «Dərc et» düyməsindən sonra sayt yenilənir.', help5: 'Səhv olarsa, «Tarixçə»dən köhnə versiyanı qaytarın.'
    },
    ru: {
      inLangs: 'На трёх языках', apiBrokenT: 'Серверная часть редактора не работает', apiBrokenP: 'api/index.php не отвечает. Проверьте, что на хостинге включён PHP (см. инструкцию по установке).',
      loginSub: 'SpectrTech editor©', loginTitle: 'Вход в редактор', password: 'Пароль', showPw: 'Показать пароль', remember: 'Запомнить на этом устройстве на 30 дней',
      signIn: 'Войти', signingIn: 'Проверяем…', badPw: 'Неверный пароль.', tooMany: 'Слишком много неудачных попыток. Попробуйте снова через %1 мин.',
      netErr: 'Нет связи с сервером. Проверьте интернет и попробуйте снова.', notConfT: 'Редактор ещё не настроен',
      notConfP: 'Администратор сайта должен задать начальный пароль (см. инструкцию по установке).', loginFoot: 'Если вы забыли пароль, обратитесь к тому, кто устанавливал сайт.',
      editor: 'SpectrTech editor©', page: 'Страница', previewLang: 'Язык предпросмотра', device: 'Экран', desk: 'Компьютер', tab: 'Планшет', mob: 'Телефон',
      toolEdit: 'Правка', toolBrowse: 'Просмотр', tool: 'Режим',
      hintEdit: 'Нажмите на текст или фото, которые хотите изменить. Чтобы открыть галерею, слайдер или вкладку, переключитесь в «Просмотр».',
      hintBrowse: 'Сайт работает как обычно: ссылки, вкладки, галерея. Чтобы вносить изменения, вернитесь в «Правку».',
      publish: 'Опубликовать', saveDemo: 'Сохранить', publishing: 'Публикуем…', published: 'Опубликовано. Изменения уже на сайте.',
      savedDemo: 'Сохранено — только в этом браузере (демо).', discard: 'Отменить', discardQ: 'Удалить все неопубликованные изменения?',
      discarded: 'Изменения отменены.', pending: 'Не опубликовано: %1', pendingDemo: 'Не сохранено: %1', allPub: 'Всё опубликовано', allSaved: 'Всё сохранено',
      more: 'Ещё', history: 'История', changePw: 'Сменить пароль', logout: 'Выйти', uiLang: 'Язык редактора', openSite: 'Открыть страницу в новой вкладке', help: 'Как это работает',
      demoMode: 'Демо-режим: изменения сохраняются только в этом браузере, посетители сайта их не видят.', demoBadge: 'Демо',
      resetDemo: 'Сбросить демо-изменения', resetDemoQ: 'Удалить все демо-изменения, сохранённые в этом браузере?', resetDone: 'Демо-изменения удалены.',
      tabSel: 'Выбранное', tabTexts: 'Тексты', tabLists: 'Списки', tabContacts: 'Контакты', tabHistory: 'История',
      selEmptyT: 'Нажмите на элемент страницы', selTip1: 'Текст меняется на трёх языках: AZ, RU, EN.', selTip2: 'Фото — загрузите новое, размер подстроится сам.',
      selTip3: 'Меню, кабинет, тур — открываются со всеми полями.', selTip4: 'Когда всё готово, нажмите «Опубликовать».',
      kText: 'Текст', kHeading: 'Заголовок', kButton: 'Кнопка', kLink: 'Ссылка', kLabel: 'Поле формы', kImage: 'Фото', kPhone: 'Телефон', kChoices: 'Варианты выбора', kList: 'Список',
      changed: 'изменено', revert: 'Вернуть прежний текст', revertImg: 'Вернуть прежнее фото', revertVal: 'Вернуть как было',
      sameAll: 'Этот текст одинаков в %1 местах страницы — они меняются вместе.', generated: 'Этот текст создаётся автоматически (дата, цена или количество). Измените его в списке.',
      notEditable: 'Этот элемент не редактируется: логотип или элемент дизайна.', imgChange: 'Заменить фото', imgUpload: 'Загрузить фото', uploading: 'Загружаем…', imgRemove: 'Убрать фото',
      imgTip: 'JPG или PNG шириной от 1600 px. Фото уменьшается автоматически.', imgEverywhere: 'Фото заменится на всех страницах сайта.',
      fileTooBig: 'Файл слишком большой (не больше %1 МБ).', badImage: 'Файл не открылся как изображение. Выберите JPG, PNG, WebP или GIF.', uploadFailed: 'Фото не загрузилось. Попробуйте ещё раз.',
      demoFull: 'Демо-память браузера заполнена. Удалите часть фото или сбросьте демо-изменения.',
      add: 'Добавить', addPhoto: 'Добавить фото', up: 'Выше', down: 'Ниже', del: 'Удалить', delQ: 'Удалить «%1»?', minItems: 'В списке должно остаться не меньше %1.',
      emptySlot: 'Пустое место', untitled: 'Без названия', photo: 'Фото', notSet: 'Не показывать', listsEmpty: 'На этой странице нет отдельных списков — меняйте тексты и фото прямо на странице.',
      items: 'Элементов: %1', textsSearch: 'Поиск текста', textsNone: 'Ничего не найдено.', textsNote: 'Все тексты страницы, включая подсказки формы и текст сообщения WhatsApp.',
      phones: 'Номера телефонов', phonesNote: 'Новый номер заменит старый на всех страницах сайта, в кнопках звонка и в WhatsApp.', newNumber: 'Новый номер',
      noPhones: 'На этой странице нет номеров телефонов.', links: 'Внешние ссылки', linksNote: 'Instagram, карта, бронирование и другие сайты. Изменение применяется на всём сайте.',
      newLink: 'Новый адрес: https://…', badUrl: 'Адрес должен начинаться с https://', noLinks: 'На этой странице нет внешних ссылок.', waBadge: 'WhatsApp',
      histNote: 'Каждая публикация сохраняется отдельно. Любую прежнюю версию можно вернуть.', histEmpty: 'Опубликованных версий пока нет.', histDemo: 'В демо-режиме версии не сохраняются.',
      restore: 'Вернуть', restoreQ: 'Вернуть сайт к версии от %1? Эта версия сразу будет опубликована.', restored: 'Прежняя версия возвращена и опубликована.',
      current: 'текущая', version: 'Версия %1', cancel: 'Отмена', yes: 'Да', close: 'Закрыть', save: 'Сохранить',
      pwT: 'Сменить пароль', pwForceT: 'Задайте свой пароль', pwForceP: 'После первого входа задайте новый пароль и никому его не сообщайте.',
      pwOld: 'Текущий пароль', pwNew: 'Новый пароль (не меньше 8 символов)', pwRep: 'Повторите новый пароль', pwShort: 'Пароль должен быть не короче 8 символов.', pwMismatch: 'Пароли не совпадают.',
      pwChanged: 'Пароль изменён.', pwWrongOld: 'Текущий пароль неверный.', sessionEnd: 'Сеанс завершился. Войдите снова — изменения сохранились.',
      conflictT: 'Сайт изменили с другого устройства', conflictP: 'Если опубликовать вашу версию, те изменения будут заменены.', conflictGo: 'Опубликовать мою версию',
      draftFound: 'Найдены неопубликованные изменения (%1).', draftRestore: 'Восстановить', draftDrop: 'Удалить', loading: 'Загрузка…', frameTitle: 'Предпросмотр страницы', panelL: 'Панель правки',
      lineHint: 'По одному пункту в строке.', phoneHint: 'По одному номеру в строке, например +994 51 555 51 51.', azFallback: 'Если пусто, покажется текст AZ',
      openItem: 'Все поля этого элемента', optional: 'необязательно', bold: 'Жирный', italic: 'Курсив', link: 'Ссылка', clearFmt: 'Убрать оформление', linkPrompt: 'Адрес ссылки (https://…)',
      choicesNote: 'Варианты выпадающего списка.', errGeneric: 'Произошла ошибка. Попробуйте ещё раз.', tooLarge: 'Слишком большой объём изменений.', back: 'Назад',
      listOf: 'Список: %1', saveFirst: 'Сначала опубликуйте', inThisPage: 'На этой странице', item: 'Элемент', remove: 'Удалить', origPhoto: 'Сейчас', newPhoto: 'Новое фото',
      helpT: 'Как работает редактор', help1: 'В режиме «Правка» нажмите на текст или фото на странице — справа (на телефоне снизу) откроется панель.',
      help2: 'Тексты меняются на трёх языках. Списки (меню, кабинеты, туры) — в разделе «Списки».', help3: 'Телефоны и внешние ссылки — в разделе «Контакты».',
      help4: 'Сначала изменения видите только вы. После «Опубликовать» сайт обновится.', help5: 'Если что-то пошло не так, верните прежнюю версию в «Истории».'
    },
    en: {
      inLangs: 'In three languages', apiBrokenT: 'The editor server is not working', apiBrokenP: 'api/index.php does not respond. Check that PHP is enabled on the hosting (see the setup guide).',
      loginSub: 'SpectrTech editor©', loginTitle: 'Sign in to the editor', password: 'Password', showPw: 'Show password', remember: 'Keep me signed in on this device for 30 days',
      signIn: 'Sign in', signingIn: 'Checking…', badPw: 'Wrong password.', tooMany: 'Too many failed attempts. Try again in %1 min.',
      netErr: 'Cannot reach the server. Check your connection and try again.', notConfT: 'The editor is not set up yet',
      notConfP: 'The site administrator needs to set the initial password (see the setup guide).', loginFoot: 'Forgot the password? Contact whoever set up the site.',
      editor: 'SpectrTech editor©', page: 'Page', previewLang: 'Preview language', device: 'Screen', desk: 'Desktop', tab: 'Tablet', mob: 'Phone',
      toolEdit: 'Edit', toolBrowse: 'Browse', tool: 'Mode',
      hintEdit: 'Click the text or photo you want to change. To open a gallery, slider or tab, switch to Browse.',
      hintBrowse: 'The site works as usual: links, tabs, galleries. Switch back to Edit to make changes.',
      publish: 'Publish', saveDemo: 'Save', publishing: 'Publishing…', published: 'Published. Your changes are live.',
      savedDemo: 'Saved in this browser only (demo).', discard: 'Discard', discardQ: 'Discard all unpublished changes?',
      discarded: 'Changes discarded.', pending: 'Unpublished: %1', pendingDemo: 'Unsaved: %1', allPub: 'All published', allSaved: 'All saved',
      more: 'More', history: 'History', changePw: 'Change password', logout: 'Sign out', uiLang: 'Editor language', openSite: 'Open the page in a new tab', help: 'How it works',
      demoMode: 'Demo mode: changes are kept in this browser only; site visitors do not see them.', demoBadge: 'Demo',
      resetDemo: 'Reset demo changes', resetDemoQ: 'Delete all demo changes saved in this browser?', resetDone: 'Demo changes deleted.',
      tabSel: 'Selected', tabTexts: 'Texts', tabLists: 'Lists', tabContacts: 'Contacts', tabHistory: 'History',
      selEmptyT: 'Click something on the page', selTip1: 'Text changes in three languages: AZ, RU, EN.', selTip2: 'Photo — upload a new one; it is resized for you.',
      selTip3: 'Menus, rooms and tours open with all their fields.', selTip4: 'When you are done, press Publish.',
      kText: 'Text', kHeading: 'Heading', kButton: 'Button', kLink: 'Link', kLabel: 'Form field', kImage: 'Photo', kPhone: 'Phone', kChoices: 'Dropdown options', kList: 'List',
      changed: 'changed', revert: 'Restore the original text', revertImg: 'Restore the original photo', revertVal: 'Restore the original',
      sameAll: 'This text is the same in %1 places on the page — they change together.', generated: 'This text is generated (a date, price or count). Change it in the list.',
      notEditable: 'This element is not editable: a logo or design element.', imgChange: 'Replace photo', imgUpload: 'Upload photo', uploading: 'Uploading…', imgRemove: 'Remove photo',
      imgTip: 'JPG or PNG, at least 1600 px wide. Photos are resized automatically.', imgEverywhere: 'The photo will be replaced on every page of the site.',
      fileTooBig: 'The file is too large (up to %1 MB).', badImage: 'The file did not open as an image. Choose a JPG, PNG, WebP or GIF.', uploadFailed: 'The photo did not upload. Try again.',
      demoFull: 'The browser demo storage is full. Remove some photos or reset the demo changes.',
      add: 'Add', addPhoto: 'Add photo', up: 'Move up', down: 'Move down', del: 'Delete', delQ: 'Delete “%1”?', minItems: 'The list must keep at least %1.',
      emptySlot: 'Empty slot', untitled: 'Untitled', photo: 'Photo', notSet: 'Do not show', listsEmpty: 'This page has no separate lists — change texts and photos right on the page.',
      items: '%1 items', textsSearch: 'Search texts', textsNone: 'Nothing found.', textsNote: 'Every text on the page, including form messages and the WhatsApp message.',
      phones: 'Phone numbers', phonesNote: 'A new number replaces the old one on every page, in call buttons and in WhatsApp.', newNumber: 'New number',
      noPhones: 'There are no phone numbers on this page.', links: 'External links', linksNote: 'Instagram, maps, booking and other sites. A change applies across the site.',
      newLink: 'New address: https://…', badUrl: 'The address must start with https://', noLinks: 'There are no external links on this page.', waBadge: 'WhatsApp',
      histNote: 'Every publish is kept as a version. You can bring any earlier version back.', histEmpty: 'Nothing has been published yet.', histDemo: 'Versions are not kept in demo mode.',
      restore: 'Bring back', restoreQ: 'Bring the site back to the version from %1? It goes live straight away.', restored: 'The earlier version is back and live.',
      current: 'current', version: 'Version %1', cancel: 'Cancel', yes: 'Yes', close: 'Close', save: 'Save',
      pwT: 'Change password', pwForceT: 'Set your own password', pwForceP: 'After the first sign-in, set a new password and keep it to yourself.',
      pwOld: 'Current password', pwNew: 'New password (at least 8 characters)', pwRep: 'Repeat the new password', pwShort: 'The password needs at least 8 characters.', pwMismatch: 'The passwords do not match.',
      pwChanged: 'Password changed.', pwWrongOld: 'The current password is wrong.', sessionEnd: 'Your session ended. Sign in again — your changes are kept.',
      conflictT: 'The site was changed on another device', conflictP: 'Publishing your version will replace those changes.', conflictGo: 'Publish my version',
      draftFound: 'Unpublished changes found (%1).', draftRestore: 'Restore', draftDrop: 'Discard', loading: 'Loading…', frameTitle: 'Page preview', panelL: 'Edit panel',
      lineHint: 'One item per line.', phoneHint: 'One number per line, e.g. +994 51 555 51 51.', azFallback: 'If empty, the AZ text is shown',
      openItem: 'All fields of this item', optional: 'optional', bold: 'Bold', italic: 'Italic', link: 'Link', clearFmt: 'Clear formatting', linkPrompt: 'Link address (https://…)',
      choicesNote: 'Options of the dropdown.', errGeneric: 'Something went wrong. Try again.', tooLarge: 'The changes are too large.', back: 'Back',
      listOf: 'List: %1', saveFirst: 'Publish first', inThisPage: 'On this page', item: 'Item', remove: 'Remove', origPhoto: 'Now', newPhoto: 'New photo',
      helpT: 'How the editor works', help1: 'In Edit mode, click any text or photo on the page — the panel opens on the right (at the bottom on a phone).',
      help2: 'Texts change in three languages. Lists (menus, rooms, tours) are under Lists.', help3: 'Phone numbers and external links are under Contacts.',
      help4: 'Changes are visible only to you until you press Publish.', help5: 'If something goes wrong, bring back an earlier version from History.'
    }
  };
  let ui = (() => { try { const v = localStorage.getItem('stx_ui'); if (U[v]) return v; } catch (e) {} const n = (navigator.language || '').slice(0, 2); return U[n] ? n : 'az'; })();
  const T = (k, ...a) => { let s = (U[ui] && U[ui][k]) || U.az[k] || k; a.forEach((v, i) => { s = s.replace('%' + (i + 1), v); }); return s; };
  const tr = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[ui] || o.az || ''));
  const LNAME = { az: 'Azərbaycanca', ru: 'Русский', en: 'English' };

  /* ───────────── утилиты ───────────── */
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const own = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
  function h(tag, attrs, ...kids) {
    const e = D.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat(3)) if (c != null && c !== false) e.append(c.nodeType ? c : D.createTextNode(String(c)));
    return e;
  }
  const IC = {
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', img: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', desk: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>',
    tab: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>', mob: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', key: '<circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l10-10M16 7l2 2M14 9l2 2"/>',
    out: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>', reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
  };
  const icon = (n) => { const s = D.createElement('span'); s.style.display = 'contents'; s.innerHTML = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>'; return s.firstChild; };
  const ibtn = (name, label, on, cls) => h('button', { type: 'button', class: 'btn icon sm ghost' + (cls ? ' ' + cls : ''), 'aria-label': label, title: label, onclick: on }, icon(name));
  function getP(o, path) { for (const k of String(path).split('.')) { if (o == null) return undefined; o = o[k]; } return o; }
  function setP(o, path, v) {
    const ks = String(path).split('.');
    for (let i = 0; i < ks.length - 1; i++) { const k = ks[i]; if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; }
    o[ks[ks.length - 1]] = v;
  }
  const strip = (s) => String(s == null ? '' : s).replace(/<[^>]*>/g, '');
  /* та же очистка, что в st-content.js: разрешены только строчные теги и безопасные ссылки */
  function cleanHTML(s) {
    const txt = (x) => x.replace(/</g, '\u2039').replace(/>/g, '\u203A').replace(/"/g, '\u201D');
    const OK = { i: 1, em: 1, b: 1, strong: 1, br: 1, small: 1, span: 1, u: 1, s: 1, sup: 1, sub: 1, mark: 1, a: 1, wbr: 1 };
    const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g;
    s = String(s == null ? '' : s); let out = '', last = 0, m;
    while ((m = re.exec(s))) {
      out += txt(s.slice(last, m.index)); last = re.lastIndex;
      const n = m[2].toLowerCase(); if (!OK[n]) continue;
      if (m[1]) { if (n !== 'br' && n !== 'wbr') out += '</' + n + '>'; continue; }
      let at = '';
      if (n === 'a') { const hm = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(m[3]); const u = hm ? (hm[1] != null ? hm[1] : hm[2] != null ? hm[2] : hm[3]) : ''; if (/^(?:https?:\/\/|tel:|mailto:)[^\s"'<>]*$/i.test(u) || (/^[\w.\/#?=&%-]+$/.test(u) && u.indexOf(':') < 0)) at = ' href="' + u + '"' + (/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : ''); }
      out += '<' + n + at + '>';
    }
    return out + txt(s.slice(last));
  }
  const normT = (s) => strip(s).replace(/[  ]/g, ' ').replace(/[⁠​­]/g, '').replace(/[‑‐]/g, '-').replace(/\s+/g, ' ').trim();
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
  function smartQuotes(s, lg) {
    if (!/"/.test(s)) return s;
    const o = lg === 'en' ? '“' : '«', c = lg === 'en' ? '”' : '»';
    return s.replace(/(^|[\s(\[{>])"/g, '$1' + o).replace(/"/g, c);
  }
  const digits = (s) => String(s || '').replace(/\D/g, '');
  function normTel(s) { let d = digits(s); if (d.indexOf('00') === 0) d = d.slice(2); if (/^0\d{9}$/.test(d)) d = '994' + d.slice(1); if (/^\d{9}$/.test(d)) d = '994' + d; return d; }
  function fmtTel(d) { d = normTel(d); const m = /^994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(d); return m ? '+994 ' + m[1] + ' ' + m[2] + ' ' + m[3] + ' ' + m[4] : (d ? '+' + d : ''); }
  function phoneValue(s) { s = String(s || '').trim(); const d = normTel(s); return /^994\d{9}$/.test(d) ? '+' + d : s; }
  const when = (ts) => { try { return new Date(ts).toLocaleString(ui === 'en' ? 'en-GB' : ui === 'ru' ? 'ru-RU' : 'az-Latn-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(ts); } };

  /* ───────────── состояние ───────────── */
  const S = {
    mode: null, token: null, status: null, pub: null, draft: null, started: false,
    page: null, win: null, doc: null, P: null, plang: 'az', tool: 'edit', device: 'desk',
    tab: 'sel', sel: null, list: null, work: null, keepY: 0, maxUpload: 10 * 1024 * 1024
  };
  const STE = W.STE = {
    draft: () => S.draft,
    ready: (win) => onFrameReady(win)
  };

  /* ───────────── API ───────────── */
  async function api(a, o = {}) {
    const headers = {};
    if (S.token) headers['X-ST-Token'] = S.token;
    let body;
    if (o.form) body = o.form;
    else if (o.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(o.body); }
    let r;
    try { r = await fetch(API + '?a=' + encodeURIComponent(a), { method: o.method || (body ? 'POST' : 'GET'), headers, body, cache: 'no-store', credentials: 'same-origin' }); }
    catch (e) { return { ok: false, error: 'network' }; }
    let j = null;
    try { j = await r.json(); } catch (e) { j = null; }
    if (!j || typeof j !== 'object') return { ok: false, error: r.status === 404 ? 'no_api' : 'bad_response', status: r.status };
    j.status = r.status;
    if (r.status === 401 && a !== 'login' && a !== 'password' && S.started) authLost();
    return j;
  }
  const TOKKEY = 'stx_tok:' + SITE;
  function loadToken() { try { return sessionStorage.getItem(TOKKEY) || localStorage.getItem(TOKKEY) || null; } catch (e) { return null; } }
  function saveToken(t, remember) {
    S.token = t;
    try { sessionStorage.removeItem(TOKKEY); localStorage.removeItem(TOKKEY); (remember ? localStorage : sessionStorage).setItem(TOKKEY, t); } catch (e) {}
    S.remember = !!remember;
  }
  function dropToken() { S.token = null; try { sessionStorage.removeItem(TOKKEY); localStorage.removeItem(TOKKEY); } catch (e) {} }

  /* ───────────── контент ───────────── */
  function normC(c) {
    c = c && typeof c === 'object' ? clone(c) : {};
    c.v = 1; c.site = c.site || SITE; c.rev = +c.rev || 0;
    if (!c.pages || typeof c.pages !== 'object' || Array.isArray(c.pages)) c.pages = {};
    for (const k of ['img', 'tel', 'href']) if (!c[k] || typeof c[k] !== 'object' || Array.isArray(c[k])) c[k] = {};
    return c;
  }
  function tidy(c) {
    c = normC(c);
    for (const id of Object.keys(c.pages)) {
      const p = c.pages[id] || {};
      if (p.t) { for (const lg of Object.keys(p.t)) if (!p.t[lg] || !Object.keys(p.t[lg]).length) delete p.t[lg]; if (!Object.keys(p.t).length) delete p.t; }
      if (p.d && !Object.keys(p.d).length) delete p.d;
      if (!p.t && !p.d) delete c.pages[id];
    }
    return c;
  }
  function countDiff() {
    const a = tidy(S.draft), b = tidy(S.pub);
    let n = 0;
    const ids = new Set([...Object.keys(a.pages), ...Object.keys(b.pages)]);
    ids.forEach((id) => {
      const pa = a.pages[id] || {}, pb = b.pages[id] || {};
      LANGS.forEach((lg) => {
        const ta = (pa.t || {})[lg] || {}, tb = (pb.t || {})[lg] || {};
        new Set([...Object.keys(ta), ...Object.keys(tb)]).forEach((k) => { if (!eq(ta[k], tb[k])) n++; });
      });
      const da = pa.d || {}, db = pb.d || {};
      new Set([...Object.keys(da), ...Object.keys(db)]).forEach((k) => { if (!eq(da[k], db[k])) n++; });
    });
    for (const m of ['img', 'tel', 'href']) new Set([...Object.keys(a[m]), ...Object.keys(b[m])]).forEach((k) => { if (a[m][k] !== b[m][k]) n++; });
    return n;
  }
  function PD(id) { id = id || S.page.id; const p = S.draft.pages[id] || (S.draft.pages[id] = {}); p.t = p.t || {}; p.d = p.d || {}; return p; }
  function defT(lg, path) { const P = S.P; return P && P.def && P.def.I[lg] ? getP(P.def.I[lg], path) : undefined; }
  function hasT(lg, path) { const p = S.draft.pages[S.page.id]; return !!(p && p.t && p.t[lg] && own(p.t[lg], path)); }
  function curT(lg, path) { const p = S.draft.pages[S.page.id]; return hasT(lg, path) ? p.t[lg][path] : defT(lg, path); }
  function setT(lg, path, v, quiet) {
    const p = PD(); p.t[lg] = p.t[lg] || {};
    if (v === undefined || eq(v, defT(lg, path))) delete p.t[lg][path]; else p.t[lg][path] = clone(v);
    changed();
    if (!quiet) liveT(lg, path, v === undefined ? defT(lg, path) : v);
  }
  function liveT(lg, path, v) {
    const P = S.P; if (!P || !P.I[lg] || !S.win || !S.win.STC) return;
    const cl = (x) => (typeof x === 'string' ? S.win.STC.clean(x) : Array.isArray(x) ? x.map(cl) : x);
    try { setP(P.I[lg], path, cl(clone(v))); } catch (e) {}
    refreshSoon();
  }
  function defD(name) { const P = S.P; return P && P.def ? P.def.data[name] : undefined; }
  function curD(name) { const p = S.draft.pages[S.page.id]; return clone(p && p.d && own(p.d, name) ? p.d[name] : defD(name)); }
  function setD(name, v) { const p = PD(); if (eq(v, defD(name))) delete p.d[name]; else p.d[name] = clone(v); changed(); reloadSoon(); }
  function setMap(m, k, v) { if (v == null || v === '' || v === k) delete S.draft[m][k]; else S.draft[m][k] = v; changed(); reloadSoon(); }

  function changed() { updateStatus(); autosave(); }
  const autosave = debounce(() => {
    try { localStorage.setItem('stx_draft:' + SITE + ':' + S.mode, JSON.stringify({ base: S.pub.rev, at: Date.now(), draft: tidy(S.draft) })); } catch (e) {}
  }, 700);
  function clearAutosave() { try { localStorage.removeItem('stx_draft:' + SITE + ':' + S.mode); } catch (e) {} }

  /* ───────────── запуск ───────────── */
  async function boot() {
    applyUi();
    /* демо (content/site.js с demo:true) — без сервера, API не опрашиваем */
    const st = W.ST_CONTENT && W.ST_CONTENT.demo ? { ok: false, error: 'demo' } : await api('status');
    if (st.ok && st.app === 'st-editor') {
      S.mode = 'server'; S.status = st; if (st.maxUpload) S.maxUpload = st.maxUpload;
      if (!st.configured) return showLogin('notconf');
      S.token = loadToken();
      if (S.token) {
        const r = await api('content');
        if (r.ok) return start(r.content);
        dropToken();
      }
      return showLogin();
    }
    if (st.error === 'bad_response' && st.status === 200) return showLogin('broken');
    S.mode = 'demo';
    let c = normC(W.ST_CONTENT);
    try { const raw = localStorage.getItem('stx_demo:' + SITE); if (raw) { const L = JSON.parse(raw); if (L && L.v === 1) c = normC(L); } } catch (e) {}
    c.demo = true;
    start(c);
  }
  function start(content) {
    $('login').hidden = true;
    if (S.started) { S.pub = normC(content); updateStatus(); return; }
    S.started = true;
    S.pub = normC(content);
    S.draft = normC(content);
    $('app').hidden = false;
    if (S.mode === 'demo') D.body.classList.add('demo');
    /* плашка DEMO с сервера spectrtech.az добавляется после этого скрипта — оставляем под неё место */
    const mark = () => { if (D.getElementById('st-demo-mark')) D.body.classList.add('has-mark'); };
    mark(); setTimeout(mark, 600); W.addEventListener('load', mark);
    buildBar();
    const hid = (location.hash || '').slice(1).split('/')[0];
    goPage(CFG.pages.some((p) => p.id === hid) ? hid : CFG.pages[0].id);
    offerAutosave();
    updateStatus();
  }
  function offerAutosave() {
    let a = null;
    try { a = JSON.parse(localStorage.getItem('stx_draft:' + SITE + ':' + S.mode) || 'null'); } catch (e) { a = null; }
    if (!a || !a.draft || a.base !== S.pub.rev || eq(tidy(a.draft), tidy(S.pub))) return;
    const b = h('div', { class: 'banner', role: 'status' }, h('span', { text: T('draftFound', when(a.at)) }),
      h('button', { type: 'button', class: 'btn', text: T('draftRestore'), onclick: () => { S.draft = normC(a.draft); b.remove(); afterBigChange(); } }),
      h('button', { type: 'button', class: 'btn ghost', text: T('draftDrop'), onclick: () => { clearAutosave(); b.remove(); } }));
    D.body.append(b);
  }
  function afterBigChange() { S.sel = null; S.list = null; S.item = null; S.work = null; updateStatus(); loadFrame(true); renderPanel(); }

  /* ───────────── вход ───────────── */
  function showLogin(kind, msg) {
    $('login').hidden = false;
    $('loginForm').hidden = kind === 'notconf' || kind === 'broken';
    $('notConf').hidden = kind !== 'notconf' && kind !== 'broken';
    if (kind === 'broken') { $('notConf').querySelector('h1').textContent = T('apiBrokenT'); $('notConf').querySelector('p').textContent = T('apiBrokenP'); }
    $('loginErr').textContent = msg || '';
    if (kind !== 'notconf') setTimeout(() => $('pw').focus(), 30);
  }
  function authLost() { dropToken(); showLogin(null, T('sessionEnd')); }
  async function doLogin(e) {
    e.preventDefault();
    const pw = $('pw').value, btn = $('loginBtn'), err = $('loginErr');
    if (!pw) { err.textContent = T('badPw'); $('pw').focus(); return; }
    btn.disabled = true; btn.textContent = T('signingIn'); err.textContent = '';
    const r = await api('login', { body: { password: pw, remember: $('remember').checked } });
    btn.disabled = false; btn.textContent = T('signIn');
    if (!r.ok) {
      err.textContent = r.error === 'bad_password' ? T('badPw') : r.error === 'too_many' ? T('tooMany', Math.max(1, Math.ceil((r.retryAfter || 900) / 60))) : r.error === 'not_configured' ? T('notConfP') : r.error === 'network' ? T('netErr') : T('errGeneric');
      $('pw').select(); return;
    }
    saveToken(r.token, $('remember').checked);
    $('pw').value = '';
    if (r.mustChange) { const ok = await passwordDialog(true, pw); if (!ok) { dropToken(); return showLogin(); } }
    const c = await api('content');
    if (!c.ok) { err.textContent = T('errGeneric'); return; }
    start(c.content);
  }

  /* ───────────── верхняя панель ───────────── */
  function applyUi() {
    D.documentElement.lang = ui;
    D.querySelectorAll('[data-u]').forEach((e) => { e.textContent = T(e.getAttribute('data-u')); });
    D.querySelectorAll('[data-u-aria]').forEach((e) => { e.setAttribute('aria-label', T(e.getAttribute('data-u-aria'))); });
    D.querySelectorAll('[data-u-title]').forEach((e) => { e.setAttribute('title', T(e.getAttribute('data-u-title'))); });
    D.title = CFG.brand + ' — ' + T('editor');
  }
  function seg(el, items, cur, on) {
    el.replaceChildren(...items.map((it) => h('button', { type: 'button', 'aria-pressed': String(it.v === cur), title: it.title || null, 'aria-label': it.aria || null, onclick: () => on(it.v) }, it.icon ? icon(it.icon) : null, it.label ? h('span', { class: 'tl', text: it.label }) : null)));
  }
  function buildBar() {
    const ps = $('pageSel');
    ps.replaceChildren(...CFG.pages.map((p) => h('option', { value: p.id, text: tr(p.name) })));
    ps.onchange = () => goPage(ps.value);
    renderSegs();
    $('publishBtn').onclick = publish;
    $('discardBtn').onclick = discardAll;
    $('menuBtn').onclick = toggleMenu;
    $('sheetTog').onclick = () => sheet(!$('panel').classList.contains('open'));
    D.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); publish(); }
      if (e.key === 'Escape' && !$('menu').hidden) { $('menu').hidden = true; $('menuBtn').setAttribute('aria-expanded', 'false'); $('menuBtn').focus(); }
    });
    D.addEventListener('click', (e) => { if (!$('menu').hidden && !e.target.closest('.menu-wrap')) { $('menu').hidden = true; $('menuBtn').setAttribute('aria-expanded', 'false'); } });
    W.addEventListener('beforeunload', (e) => { if (S.started && countDiff()) { e.preventDefault(); e.returnValue = ''; } });
  }
  function renderSegs() {
    seg($('langSeg'), LANGS.map((l) => ({ v: l, label: l.toUpperCase(), title: LNAME[l] })), S.plang, setPlang);
    seg($('devSeg'), ['desk', 'tab', 'mob'].map((d) => ({ v: d, icon: d, aria: T(d), title: T(d) })), S.device, (d) => { S.device = d; const fw = $('fw'); fw.classList.toggle('tab', d === 'tab'); fw.classList.toggle('mob', d === 'mob'); renderSegs(); });
    seg($('toolSeg'), [{ v: 'edit', icon: 'edit', label: T('toolEdit'), title: T('toolEdit') }, { v: 'browse', icon: 'eye', label: T('toolBrowse'), title: T('toolBrowse') }], S.tool, setTool);
    $('toolSeg').setAttribute('aria-label', T('tool'));
    $('toolHint').textContent = S.tool === 'edit' ? T('hintEdit') : T('hintBrowse');
  }
  function setTool(t) {
    S.tool = t; renderSegs();
    if (S.doc) { S.doc.documentElement.classList.toggle('ste-edit', t === 'edit'); clearHover(); }
  }
  function setPlang(lg) {
    S.plang = lg; renderSegs();
    const b = S.doc && S.doc.querySelector('.lang button[data-lang="' + lg + '"]');
    if (b) b.click(); else loadFrame(true);
    setTimeout(renderPanel, 60);
  }
  function toggleMenu() {
    const m = $('menu'), open = m.hidden;
    $('menuBtn').setAttribute('aria-expanded', String(open));
    if (!open) { m.hidden = true; return; }
    const close = () => { m.hidden = true; $('menuBtn').setAttribute('aria-expanded', 'false'); };
    const item = (ic, label, fn) => h('button', { type: 'button', onclick: () => { close(); fn(); } }, icon(ic), label);
    const langSeg = h('div', { class: 'seg', role: 'group', 'aria-label': T('uiLang') });
    seg(langSeg, LANGS.map((l) => ({ v: l, label: l.toUpperCase(), title: LNAME[l] })), ui, (l) => { ui = l; try { localStorage.setItem('stx_ui', l); } catch (e) {} applyUi(); renderSegs(); buildBarPages(); updateStatus(); renderPanel(); close(); });
    const narrow = [];
    if (W.matchMedia('(max-width:900px)').matches) {
      const ls = h('div', { class: 'seg', role: 'group', 'aria-label': T('previewLang') });
      seg(ls, LANGS.map((l) => ({ v: l, label: l.toUpperCase(), title: LNAME[l] })), S.plang, (l) => { close(); setPlang(l); });
      narrow.push(h('div', { class: 'mlabel', text: T('previewLang') }), ls,
        item('undo', T('discard'), discardAll), h('hr'));
    }
    m.replaceChildren(...[
      ...narrow,
      item('ext', T('openSite'), () => W.open(S.page.file + (S.plang !== 'az' ? '?lang=' + S.plang : ''), '_blank', 'noopener')),
      item('help', T('help'), () => { S.sel = null; setTab('sel'); }),
      S.mode === 'server' ? item('clock', T('history'), () => setTab('history')) : null,
      S.mode === 'server' ? item('key', T('changePw'), () => passwordDialog(false)) : null,
      S.mode === 'demo' ? item('reset', T('resetDemo'), resetDemo) : null,
      h('hr'), h('div', { class: 'mlabel', text: T('uiLang') }), langSeg,
      S.mode === 'server' ? h('hr') : null,
      S.mode === 'server' ? item('out', T('logout'), logout) : null
    ].filter(Boolean));
    m.hidden = false;
    const f = m.querySelector('button'); if (f) f.focus();
  }
  function buildBarPages() { const ps = $('pageSel'); [...ps.options].forEach((o) => { const p = CFG.pages.find((x) => x.id === o.value); if (p) o.textContent = tr(p.name); }); }
  function updateStatus() {
    if (!S.started) return;
    const n = countDiff(), st = $('status'), demo = S.mode === 'demo';
    st.className = 'status' + (n ? '' : ' saved');
    st.replaceChildren(h('span', { class: 'dot', 'aria-hidden': 'true' }), h('span', { class: 'txt', text: n ? T(demo ? 'pendingDemo' : 'pending', n) : T(demo ? 'allSaved' : 'allPub') }), ...(demo ? [h('span', { class: 'badge', text: T('demoBadge') })] : []));
    const pb = $('publishBtn'); pb.disabled = !n; pb.textContent = T(demo ? 'saveDemo' : 'publish');
    $('discardBtn').disabled = !n;
  }

  /* ───────────── предпросмотр (iframe) ───────────── */
  function goPage(id, hash) {
    const pg = CFG.pages.find((p) => p.id === id) || CFG.pages[0];
    S.page = pg; $('pageSel').value = pg.id;
    try { history.replaceState(null, '', '#' + pg.id); } catch (e) {}
    S.sel = null; S.list = null; S.item = null; S.work = null; S.P = null;
    S.hash = hash || '';
    loadFrame(false);
    renderPanel();
  }
  function loadFrame(keep) {
    $('fw').classList.add('loading');
    S.keepY = keep && S.win ? S.win.scrollY : 0;
    const q = '?st_edit=1' + (S.plang && S.plang !== 'az' ? '&lang=' + S.plang : '');
    S.win = null; S.doc = null;
    $('frame').src = S.page.file + q + (keep ? '' : S.hash || '');
  }
  const reloadSoon = debounce(() => loadFrame(true), 450);
  const refreshSoon = debounce(() => { try { S.P && S.P.refresh && S.P.refresh(); } catch (e) {} reselect(); }, 140);
  function onFrameReady(win) {
    if (win !== $('frame').contentWindow) return;
    const first = !S.P || !win.ST_PAGE || S.P.id !== win.ST_PAGE.id;
    S.win = win; S.doc = win.document; S.P = win.ST_PAGE || null;
    $('fw').classList.remove('loading');
    const L = S.doc.documentElement.lang; if (LANGS.includes(L)) S.plang = L;
    attach();
    if (S.keepY) { const de = S.doc.documentElement; const sb = de.style.scrollBehavior; de.style.scrollBehavior = 'auto'; win.scrollTo(0, S.keepY); de.style.scrollBehavior = sb; }
    renderSegs(); reselect();
    /* после перезагрузки предпросмотра панель не перерисовываем — иначе теряется фокус в поле ввода */
    if (first || S.tab === 'contacts') renderPanel();
  }
  function attach() {
    const doc = S.doc;
    const st = doc.createElement('style');
    st.textContent = 'html.ste-edit body{cursor:default}html.ste-edit [data-ste-h]{outline:2px dashed #C9A96A!important;outline-offset:3px!important;cursor:pointer!important}[data-ste-s]{outline:3px solid #C9A96A!important;outline-offset:3px!important;box-shadow:0 0 0 6px rgba(255,255,255,.5)!important}';
    doc.head.append(st);
    doc.documentElement.classList.toggle('ste-edit', S.tool === 'edit');
    doc.addEventListener('mouseover', onOver, true);
    doc.addEventListener('mouseout', (e) => { if (!e.relatedTarget) clearHover(); }, true);
    doc.addEventListener('click', onClick, true);
    doc.addEventListener('submit', (e) => { if (S.tool === 'edit') { e.preventDefault(); e.stopPropagation(); } }, true);
    doc.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); publish(); } }, true);
  }
  let hov = null;
  function clearHover() { if (hov) { hov.removeAttribute('data-ste-h'); hov = null; } }
  const HOVER = 'img,[data-i18n],[data-i18n-html],h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,label,button,a,b,strong,em,i,small,span,td,th,blockquote,time,select,summary';
  function onOver(e) {
    if (S.tool !== 'edit' || !e.isTrusted) return;
    const t = e.target;
    if (!t.closest || t.closest('#st-demo-mark')) return;
    const el = t.tagName === 'IMG' ? t : t.closest(HOVER) || t;
    if (el === hov) return;
    clearHover(); hov = el; el.setAttribute('data-ste-h', '');
  }
  function pageOfHref(href) {
    const m = /^(?:\.\/)?([\w-]+\.html)(?:\?[^#]*)?(#.*)?$/.exec(href || '');
    if (!m) return null;
    const pg = CFG.pages.find((p) => p.file === m[1]);
    return pg ? { pg, hash: m[2] || '' } : null;
  }
  function onClick(e) {
    if (!e.isTrusted) return;
    const t = e.target;
    if (!t.closest || t.closest('#st-demo-mark')) return;
    const a = t.closest('a[href]');
    if (S.tool === 'browse') {
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const ip = pageOfHref(href);
      if (ip) { e.preventDefault(); e.stopPropagation(); goPage(ip.pg.id, ip.hash); return; }
      if (/^https?:/i.test(href) && a.target !== '_blank') { e.preventDefault(); e.stopPropagation(); W.open(a.href, '_blank', 'noopener'); }
      return;
    }
    if (t.closest('.lang button')) { setTimeout(() => { const L = S.doc && S.doc.documentElement.lang; if (LANGS.includes(L)) { S.plang = L; renderSegs(); renderPanel(); } }, 80); return; }
    if (!t.closest('summary,[role=tab]')) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
    pick(e);
  }

  /* ───────────── что выбрано на странице ───────────── */
  function textAt(doc, x, y) {
    let node = null;
    try {
      if (doc.caretPositionFromPoint) { const p = doc.caretPositionFromPoint(x, y); node = p && p.offsetNode; }
      else if (doc.caretRangeFromPoint) { const r = doc.caretRangeFromPoint(x, y); node = r && r.startContainer; }
    } catch (e) { node = null; }
    if (!node || node.nodeType !== 3 || !node.data.trim()) return null;
    const r = doc.createRange(); r.selectNodeContents(node);
    for (const b of r.getClientRects()) if (x >= b.left - 3 && x <= b.right + 3 && y >= b.top - 3 && y <= b.bottom + 3) return node;
    return null;
  }
  function parseSt(s) { const ps = String(s).split('.'); return { ds: ps[0], path: ps.slice(1).map((x) => (/^\d+$/.test(x) ? +x : x)) }; }
  function dsSpec(name) { return S.page.data && S.page.data[name]; }
  function textCands(tn) {
    const out = [], add = (s) => { s = normT(s); if (s && s.length < 600 && !out.includes(s)) out.push(s); };
    add(tn.data);
    let el = tn.parentElement;
    for (let i = 0; i < 3 && el; i++, el = el.parentElement) { if (el.matches('[data-st],body,main,section,article')) break; add(el.textContent); }
    return out;
  }
  function findI(cands) {
    const P = S.P; if (!P) return [];
    const lg = S.plang, ph = S.page.placeholders || [];
    const hits = cands.map(() => []);
    (function walk(o, pre, dep) {
      if (dep > 7 || !o) return;
      for (const k of Object.keys(o)) {
        const v = o[k], p = pre ? pre + '.' + k : k;
        if (typeof v === 'string') { const n = normT(v); const i = cands.indexOf(n); if (i >= 0 && !ph.includes(p.split('.')[0])) hits[i].push(p); }
        else if (v && typeof v === 'object') walk(v, p, dep + 1);
      }
    })(P.I[lg], '', 0);
    for (const h0 of hits) if (h0.length) return h0;
    return [];
  }
  function findData(cands) {
    const P = S.P; if (!P) return null;
    let found = null;
    (function walk(o, path, dep) {
      if (found || dep > 6 || !o || typeof o !== 'object') return;
      for (const k of Object.keys(o)) {
        const v = o[k];
        if (typeof v === 'string') { if (cands.includes(normT(v))) { found = path.concat(Array.isArray(o) ? +k : k); return; } }
        else walk(v, path.concat(Array.isArray(o) ? +k : k), dep + 1);
      }
    })(P.data, [], 0);
    return found;
  }
  function refPaths(ds, idx) {
    const sp = dsSpec(ds), data = curD(ds);
    if (!sp || !sp.item || !data || data[idx] === undefined) return [];
    const out = [];
    (function walk(fields, item) { for (const f of fields || []) { if (f.type === 'ref') { try { out.push(f.path(item)); } catch (e) {} } else if (f.type === 'group' && !f.k) walk(f.fields, item); } })(sp.item.fields, data[idx]);
    return out;
  }
  function itemHasImage(ds) {
    const sp = dsSpec(ds); if (!sp || !sp.item) return false;
    return (function has(fields) { return (fields || []).some((f) => f.type === 'image' || f.type === 'images' || (f.type === 'list' && f.item && has(f.item.fields))); })(sp.item.fields);
  }
  function kindOf(el) {
    if (!el) return T('kText');
    if (el.closest('h1,h2,h3,h4,h5,h6')) return T('kHeading');
    if (el.closest('label')) return T('kLabel');
    if (el.closest('button')) return T('kButton');
    if (el.closest('a[href]')) return T('kLink');
    return T('kText');
  }
  function pick(e) {
    const doc = S.doc, t = e.target, x = e.clientX, y = e.clientY;
    const sel = t.closest('select');
    if (sel) return pickSelect(sel);
    if (/^(INPUT|TEXTAREA)$/.test(t.tagName)) { const lb = t.id && doc.querySelector('label[for="' + t.id + '"]'); if (lb) return pickTextEl(lb); return showSel({ kind: 'none', el: t }); }
    const tn = textAt(doc, x, y);
    let img = t.tagName === 'IMG' ? t : null;
    if (!img && !tn) img = doc.elementsFromPoint(x, y).find((el) => el.tagName === 'IMG') || null;
    if (tn) return pickText(tn);
    if (img) return pickImage(img);
    const item = t.closest('[data-st]');
    if (item) return openItem(parseSt(item.getAttribute('data-st')), { el: item });
    showSel({ kind: 'none', el: t });
  }
  function pickTextEl(el) { const tw = S.doc.createTreeWalker(el, 4); let n; while ((n = tw.nextNode())) if (n.data.trim()) return pickText(n); showSel({ kind: 'none', el }); }
  function pickText(tn) {
    const el = tn.parentElement;
    const i18n = el.closest('[data-i18n],[data-i18n-html]');
    const link = el.closest('a[href]');
    if (i18n) { const key = i18n.getAttribute('data-i18n') || i18n.getAttribute('data-i18n-html'); return showText([key], i18n, { html: i18n.hasAttribute('data-i18n-html'), link }); }
    const itemEl = el.closest('[data-st]');
    const cands = textCands(tn);
    const paths = findI(cands);
    if (itemEl) {
      const it = parseSt(itemEl.getAttribute('data-st'));
      const refs = refPaths(it.ds, it.path[0]);
      const mine = paths.filter((p) => refs.includes(p));
      if (mine.length || !paths.length) return openItem(it, { el: itemEl, ref: mine[0], text: cands[0] });
      return showText(paths, el, { item: it, link });
    }
    if (paths.length) return showText(paths, el, { link });
    const tel = el.closest('a[href^="tel:"]');
    if (tel) return showPhone(normTel(tel.getAttribute('data-st-href') || tel.getAttribute('href')), el);
    if (/(?:\+?994|\b0)[\s\-()]*\d{2}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/.test(tn.data)) return showPhone(normTel(tn.data), el);
    const dp = findData(cands);
    if (dp) { const sp = dsSpec(dp[0]); if (sp && sp.dict) return showDict(dp[0], dp[1], el); return openItem({ ds: dp[0], path: dp.slice(1, 2) }, { el }); }
    if (link && /^https?:/i.test(link.getAttribute('data-st-href') || link.getAttribute('href') || '')) return showLink(link);
    const gen = /\d/.test(tn.data) && !el.closest('header .logo, .logo, .bn, .lang');
    showSel({ kind: gen ? 'generated' : 'none', el });
  }
  function origOf(img) {
    const o = img.getAttribute('data-st-orig'); if (o) return o;
    const s = img.getAttribute('src') || '';
    for (const m of [S.draft.img, S.pub.img]) for (const k of Object.keys(m)) if (m[k] === s) return k;
    return s;
  }
  function pickImage(img) {
    const itemEl = img.closest('[data-st]');
    if (itemEl) { const it = parseSt(itemEl.getAttribute('data-st')); if (itemHasImage(it.ds)) return openItem(it, { el: itemEl, img: img.getAttribute('src') }); }
    showImage(img);
  }
  function pickSelect(sel) {
    const opts = [...sel.options].map((o) => normT(o.textContent)).filter(Boolean);
    const rows = [];
    opts.forEach((t) => { const ps = findI([t]); if (ps.length) rows.push({ text: t, paths: ps }); });
    if (!rows.length) return showSel({ kind: 'none', el: sel });
    S.sel = { kind: 'choices', el: sel, rows }; highlight(sel); renderSelTab();
  }

  /* ───────────── подсветка ───────────── */
  function highlight(el) {
    if (S.doc) S.doc.querySelectorAll('[data-ste-s]').forEach((x) => x.removeAttribute('data-ste-s'));
    if (el && el.setAttribute) el.setAttribute('data-ste-s', '');
  }
  function reselect() {
    if (!S.doc || !S.sel) return;
    let el = null; const s = S.sel;
    try {
      if (s.kind === 'text' && s.paths) el = S.doc.querySelector('[data-i18n="' + s.paths[0] + '"],[data-i18n-html="' + s.paths[0] + '"]');
      if (s.kind === 'item' && s.st) el = S.doc.querySelector('[data-st="' + s.st + '"]');
      if (s.kind === 'image' && s.orig) el = S.doc.querySelector('img[data-st-orig="' + CSS.escape(s.orig) + '"],img[src="' + CSS.escape(s.orig) + '"]');
    } catch (e) { el = null; }
    if (el) highlight(el);
  }
  function showSel(sel) { S.sel = sel; highlight(sel.el); setTab('sel'); }

  /* ───────────── панель ───────────── */
  const TABS = () => [['sel', T('tabSel')], ['texts', T('tabTexts')], ['lists', T('tabLists')], ['contacts', T('tabContacts')]].concat(S.mode === 'server' ? [['history', T('tabHistory')]] : []);
  function setTab(t) { S.tab = t; renderPanel(); if (t !== 'sel' || S.sel) sheet(true); }
  function renderPanel() {
    if (!S.started) return;
    const tabs = $('ptabs');
    tabs.replaceChildren(...TABS().map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(S.tab === id), id: 'pt-' + id, onclick: () => setTab(id) }, label)));
    const body = $('pbody'); body.scrollTop = 0;
    $('sheetT').textContent = S.tab === 'sel' && !S.sel ? T('selEmptyT') : (TABS().find((x) => x[0] === S.tab) || [0, ''])[1];
    $('pbody').setAttribute('aria-labelledby', 'pt-' + S.tab);
    ({ sel: renderSelTab, texts: renderTexts, lists: renderLists, contacts: renderContacts, history: renderHistory })[S.tab]();
  }
  function sheet(open) {
    const p = $('panel'); p.classList.toggle('open', open); $('sheetTog').setAttribute('aria-expanded', String(open));
  }
  function body(...kids) { const b = $('pbody'); b.replaceChildren(...kids.flat(3).filter((x) => x != null && x !== false)); }
  function head(kind, title) { return h('div', { class: 'ph' }, h('h2', null, kind ? h('span', { class: 'kind', text: kind }) : null, title)); }
  function note(text, cls) { return h('p', { class: 'note' + (cls ? ' ' + cls : ''), text }); }

  function renderSelTab() {
    const s = S.sel;
    if (!s) {
      return body(
        S.mode === 'demo' ? note(T('demoMode'), 'warn') : null,
        h('div', { class: 'empty' }, h('h3', { text: T('selEmptyT') }), h('ul', null, ['selTip1', 'selTip2', 'selTip3', 'selTip4'].map((k) => h('li', { text: T(k) })))),
        h('div', { class: 'empty' }, h('h3', { text: T('helpT') }), h('ul', null, ['help1', 'help2', 'help3', 'help4', 'help5'].filter((k) => S.mode === 'server' || k !== 'help5').map((k) => h('li', { text: T(k) }))))
      );
    }
    if (s.kind === 'text') return renderTextSel();
    if (s.kind === 'image') return renderImageSel();
    if (s.kind === 'item') return renderItemSel();
    if (s.kind === 'phone') return renderPhoneSel();
    if (s.kind === 'link') return renderLinkSel();
    if (s.kind === 'dict') return renderDictSel();
    if (s.kind === 'choices') return renderChoicesSel();
    return body(head(null, s.kind === 'generated' ? T('kText') : T('item')), note(s.kind === 'generated' ? T('generated') : T('notEditable')));
  }

  /* ── поля ── */
  function lab(text, extra) { return h('div', { class: 'lbl' }, text, extra || null); }
  function chgMark(on) { return on ? h('span', { class: 'chg', text: T('changed') }) : null; }
  function autoGrow(ta) { const f = () => { ta.style.height = 'auto'; ta.style.height = Math.min(420, ta.scrollHeight + 2) + 'px'; }; ta.addEventListener('input', f); setTimeout(f, 0); return ta; }
  function plainInput(value, onInput, o = {}) {
    const long = o.multi || String(value || '').length > 70 || /\n/.test(value || '');
    const el = long ? autoGrow(h('textarea', { class: 'ta', rows: 2 })) : h('input', { class: 'inp' + (o.w ? ' ' + o.w : ''), type: 'text' });
    el.value = value == null ? '' : String(value);
    if (o.placeholder) el.placeholder = o.placeholder;
    if (o.lang) el.lang = o.lang;
    if (o.aria) el.setAttribute('aria-label', o.aria);
    el.addEventListener('input', () => onInput(el.value));
    el.addEventListener('change', () => { const q = smartQuotes(el.value, o.lang); if (q !== el.value) { el.value = q; onInput(q); } });
    return el;
  }
  function linesInput(arr, onInput, o = {}) {
    const ta = autoGrow(h('textarea', { class: 'ta', rows: 3 }));
    ta.value = (Array.isArray(arr) ? arr : []).join('\n');
    if (o.lang) ta.lang = o.lang;
    if (o.placeholder) ta.placeholder = o.placeholder;
    if (o.aria) ta.setAttribute('aria-label', o.aria);
    const conv = (v) => v.split('\n').map((s) => s.trim()).filter(Boolean).map((s) => (o.phones ? phoneValue(s) : smartQuotes(s, o.lang)));
    ta.addEventListener('input', () => onInput(conv(ta.value)));
    return ta;
  }
  function richInput(value, onInput, o = {}) {
    const ed = h('div', { class: 'rich-ed', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true', lang: o.lang || null, 'aria-label': o.aria || null });
    ed.innerHTML = cleanHTML(value || '');
    const ser = () => serialize(ed);
    const fire = () => onInput(ser());
    const cmd = (c, v) => { ed.focus(); D.execCommand(c, false, v); fire(); };
    const bar = h('div', { class: 'rich-bar' },
      h('button', { type: 'button', title: T('bold'), 'aria-label': T('bold'), onmousedown: (e) => e.preventDefault(), onclick: () => cmd('bold') }, h('b', { text: 'B' })),
      h('button', { type: 'button', title: T('italic'), 'aria-label': T('italic'), onmousedown: (e) => e.preventDefault(), onclick: () => cmd('italic') }, h('i', { text: 'I' })),
      h('button', { type: 'button', title: T('link'), 'aria-label': T('link'), onmousedown: (e) => e.preventDefault(), onclick: async () => { const u = await promptDialog(T('linkPrompt'), 'https://'); if (u && /^(https?:\/\/|tel:|mailto:)/i.test(u)) cmd('createLink', u); } }, icon('ext')),
      h('button', { type: 'button', title: T('clearFmt'), 'aria-label': T('clearFmt'), onmousedown: (e) => e.preventDefault(), onclick: () => { cmd('removeFormat'); cmd('unlink'); } }, '×'));
    ed.addEventListener('input', fire);
    ed.addEventListener('paste', (e) => { e.preventDefault(); const t = (e.clipboardData || W.clipboardData).getData('text/plain'); D.execCommand('insertText', false, t); });
    ed.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); D.execCommand('insertLineBreak'); fire(); } });
    return h('div', { class: 'rich' }, bar, ed);
  }
  function serialize(root) {
    const OK = { B: 'b', STRONG: 'strong', I: 'i', EM: 'em', SMALL: 'small', A: 'a', BR: 'br', U: 'u', S: 's', SUP: 'sup', SUB: 'sub' };
    let out = '';
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    (function walk(n) {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) out += esc(c.data);
        else if (c.nodeType === 1) {
          const tg = OK[c.tagName];
          if (c.tagName === 'DIV' || c.tagName === 'P') { if (out && !/<br>$/.test(out)) out += '<br>'; walk(c); continue; }
          if (!tg) { walk(c); continue; }
          if (tg === 'br') { out += '<br>'; continue; }
          if (tg === 'a') { const href = c.getAttribute('href') || ''; out += /^(https?:\/\/|tel:|mailto:|#|[\w.\/-]+$)/i.test(href) ? '<a href="' + href.replace(/"/g, '%22') + '"' + (/^https?:/i.test(href) ? ' target="_blank" rel="noopener"' : '') + '>' : '<a>'; walk(c); out += '</a>'; continue; }
          out += '<' + tg + '>'; walk(c); out += '</' + tg + '>';
        }
      }
    })(root);
    return out.replace(/(<br>)+$/, '').replace(/&nbsp;/g, ' ');
  }
  /* поле на три языка: get(lg) → значение; set(lg, v) */
  function langField(label, o) {
    const wrap = h('div', { class: 'fld' });
    const lbl = lab(label);
    const rows = h('div', { class: 'lang-rows' });
    const redraw = () => { const c = LANGS.some((lg) => o.changed && o.changed(lg)); const old = lbl.querySelector('.chg'); if (old) old.remove(); if (c) lbl.append(chgMark(true)); if (revBtn) revBtn.hidden = !c; };
    let revBtn = null;
    const ctl = {};
    LANGS.forEach((lg) => {
      const v = o.get(lg);
      const set = (nv) => { o.set(lg, nv); redraw(); };
      const ph = o.fallback && lg !== LANGS[0] ? T('azFallback') : '';
      const aria = label + ' — ' + LNAME[lg];
      const inp = o.kind === 'rich' ? richInput(v, set, { lang: lg, aria }) : o.kind === 'lines' ? linesInput(v, set, { lang: lg, placeholder: ph, aria }) : plainInput(v, set, { lang: lg, multi: o.kind === 'textarea', placeholder: ph, w: o.w, aria });
      ctl[lg] = inp;
      rows.append(h('div', { class: 'lrow' + (lg === S.plang ? ' cur' : '') }, h('span', { class: 'lg', title: LNAME[lg], text: lg.toUpperCase() }), inp));
    });
    wrap.append(lbl, rows);
    if (o.hint) wrap.append(h('p', { class: 'hint', text: o.hint }));
    if (o.kind === 'lines') wrap.append(h('p', { class: 'hint', text: T('lineHint') }));
    if (o.revert) { revBtn = h('button', { type: 'button', class: 'btn sm ghost', onclick: () => { o.revert(); refill(); redraw(); } }, icon('undo'), T('revert')); wrap.append(h('div', { class: 'acts' }, revBtn)); }
    function refill() { LANGS.forEach((lg) => { const v = o.get(lg), c = ctl[lg]; if (c.classList && c.classList.contains('rich')) c.querySelector('.rich-ed').innerHTML = cleanHTML(v || ''); else if (o.kind === 'lines') c.value = (v || []).join('\n'); else c.value = v == null ? '' : v; }); }
    redraw();
    return wrap;
  }

  /* ── выбранный текст словаря I ── */
  function showText(paths, el, o = {}) { S.sel = { kind: 'text', paths, el, o }; highlight(el); setTab('sel'); }
  function renderTextSel() {
    const s = S.sel, paths = s.paths, p0 = paths[0];
    const vals = LANGS.map((lg) => curT(lg, p0));
    const isArr = vals.some(Array.isArray);
    const html = s.o.html || LANGS.some((lg) => /<[a-z][^>]*>/i.test(String(defT(lg, p0) || '')));
    const long = vals.some((v) => String(v || '').length > 70);
    const kind = isArr ? 'lines' : html ? 'rich' : long ? 'textarea' : 'text';
    const field = langField(T('inLangs'), {
      kind,
      get: (lg) => curT(lg, p0),
      set: (lg, v) => paths.forEach((p) => setT(lg, p, v)),
      changed: (lg) => paths.some((p) => hasT(lg, p)),
      revert: () => paths.forEach((p) => LANGS.forEach((lg) => setT(lg, p, undefined)))
    });
    const prev = normT(vals[LANGS.indexOf(S.plang)] || vals[0] || '');
    body(
      head(kindOf(s.el), prev.length > 90 ? prev.slice(0, 88) + '…' : prev || T('kText')),
      paths.length > 1 ? note(T('sameAll', paths.length)) : null,
      field,
      s.o.link ? linkBlock(s.o.link) : null,
      s.o.item ? h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn sm', onclick: () => openItem(s.o.item, {}) }, T('openItem'))) : null
    );
  }
  function linkBlock(a) {
    const href = a.getAttribute('data-st-href') || a.getAttribute('href') || '';
    if (/^tel:/i.test(href)) return phoneBlock(normTel(href));
    if (/wa\.me\//i.test(href)) { const m = /wa\.me\/(\d+)/.exec(href); return m ? phoneBlock(normTel(m[1])) : null; }
    if (!/^https?:/i.test(href)) return null;
    return hrefBlock(href, normT(a.textContent) || href);
  }
  function hrefBlock(href, label) {
    const cur = S.draft.href[href] || '';
    const err = h('p', { class: 'err' });
    const inp = h('input', { class: 'inp', type: 'url', inputmode: 'url', placeholder: T('newLink'), value: cur });
    const apply = () => { const v = inp.value.trim(); if (v && !/^https:\/\/[^\s"'<>]+$/i.test(v)) { err.textContent = T('badUrl'); return; } err.textContent = ''; setMap('href', href, v); };
    inp.addEventListener('change', apply);
    return h('div', { class: 'fld' }, lab(T('kLink') + ': ' + label, chgMark(!!cur)), h('p', { class: 'hint', text: href }), inp, err);
  }

  /* ── фото по всему сайту (img) ── */
  function showImage(img) { S.sel = { kind: 'image', el: img, orig: origOf(img) }; highlight(img); setTab('sel'); }
  function renderImageSel() {
    const s = S.sel, orig = s.orig, cur = S.draft.img[orig];
    const pic = h('img', { class: 'bigimg', src: cur || orig, alt: '' });
    const btn = h('button', { type: 'button', class: 'btn gold', onclick: () => chooseImage(btn, (url) => { setMap('img', orig, url); pic.src = url; renderImageSel(); }) }, icon('img'), T('imgChange'));
    body(head(T('kImage'), ''), pic,
      h('div', { class: 'acts' }, btn, cur ? h('button', { type: 'button', class: 'btn', onclick: () => { setMap('img', orig, null); renderImageSel(); } }, icon('undo'), T('revertImg')) : null),
      h('p', { class: 'hint', text: T('imgTip') }), h('p', { class: 'hint', text: T('imgEverywhere') }));
  }

  /* ── телефоны и ссылки ── */
  function showPhone(d, el) { S.sel = { kind: 'phone', d, el }; highlight(el); setTab('sel'); }
  function renderPhoneSel() { body(head(T('kPhone'), fmtTel(S.sel.d)), phoneBlock(S.sel.d), note(T('phonesNote'))); }
  function phoneBlock(d) {
    const cur = S.draft.tel[d] || '';
    const inp = h('input', { class: 'inp md', type: 'tel', inputmode: 'tel', placeholder: fmtTel(d), value: cur, 'aria-label': T('newNumber') + ' ' + fmtTel(d) });
    inp.addEventListener('change', () => { const v = inp.value.trim(); const nd = normTel(v); setMap('tel', d, v && nd !== d ? fmtTel(nd) || v : null); if (v) inp.value = fmtTel(nd) || v; });
    const wa = S.P && (S.P.wa || []).some((n) => normTel(n) === d);
    return h('div', { class: 'fld' }, lab(fmtTel(d), wa ? h('span', { class: 'badge', text: T('waBadge') }) : chgMark(!!cur)), h('label', { class: 'hint', text: T('newNumber') }), inp);
  }
  function showLink(a) { S.sel = { kind: 'link', a, el: a }; highlight(a); setTab('sel'); }
  function renderLinkSel() { const a = S.sel.a; body(head(T('kLink'), normT(a.textContent) || ''), linkBlock(a) || note(T('notEditable'))); }

  /* ── подписи-словари (CAP) и варианты select ── */
  function showDict(ds, key, el) { S.sel = { kind: 'dict', ds, key, el }; highlight(el); setTab('sel'); }
  function renderDictSel() { const s = S.sel; body(head(T('kText'), ''), dictField(s.ds, s.key, T('kText'))); }
  function dictField(ds, key, label) {
    return langField(label, {
      kind: 'text',
      get: (lg) => { const d = curD(ds) || {}; const a = d[key]; return a ? a[LANGS.indexOf(lg)] || '' : ''; },
      set: (lg, v) => { const d = curD(ds) || {}; const a = (d[key] || LANGS.map(() => '')).slice(); a[LANGS.indexOf(lg)] = v; d[key] = a; setD(ds, d); },
      changed: () => { const a = (curD(ds) || {})[key], b = (defD(ds) || {})[key]; return !eq(a, b); }
    });
  }
  function renderChoicesSel() {
    const s = S.sel;
    body(head(T('kChoices'), ''), note(T('choicesNote')), ...s.rows.map((r, i) => langField(String(i + 1) + '. ' + r.text, {
      kind: 'text', get: (lg) => curT(lg, r.paths[0]), set: (lg, v) => r.paths.forEach((p) => setT(lg, p, v)),
      changed: (lg) => r.paths.some((p) => hasT(lg, p)), revert: () => r.paths.forEach((p) => LANGS.forEach((lg) => setT(lg, p, undefined)))
    })));
  }

  /* ───────────── списки данных ───────────── */
  function openItem(it, o = {}) {
    const sp = dsSpec(it.ds);
    if (!sp) return showSel({ kind: 'none', el: o.el });
    S.item = { ds: it.ds, idx: sp.lines || sp.phones ? null : it.path[0] != null ? it.path[0] : null, sub: it.path.slice(1), focusRef: o.ref, img: o.img };
    S.work = { ds: it.ds, data: curD(it.ds) };
    S.sel = { kind: 'item', st: it.ds + (it.path.length ? '.' + it.path[0] : ''), el: o.el };
    highlight(o.el);
    setTab('sel');
  }
  function renderItemSel() { renderListView(S.item, true); }
  function renderLists() {
    if (S.list) return renderListView(S.list, false);
    const ds = S.page.data ? Object.keys(S.page.data).filter((k) => !S.page.data[k].hidden) : [];
    if (!ds.length) return body(head(null, T('tabLists')), note(T('listsEmpty')));
    if (!S.P) return body(head(null, T('tabLists')), note(T('loading')));
    body(head(null, T('tabLists')), h('ul', { class: 'ds-list' }, ds.map((n) => {
      const sp = S.page.data[n], v = curD(n), cnt = Array.isArray(v) ? v.length : 0;
      const p = S.draft.pages[S.page.id];
      return h('li', null, h('button', { type: 'button', class: 'open', onclick: () => { S.list = { ds: n, idx: null }; S.work = { ds: n, data: curD(n) }; renderPanel(); } },
        h('span', { class: 't', text: tr(sp.title) }), h('span', { class: 's' }, p && p.d && own(p.d, n) ? h('span', { class: 'chg', text: T('changed') + ' ' }) : null, h('span', { class: 'cnt', text: String(cnt) }))));
    })));
  }
  function ctx() {
    const lg = S.plang, li = Math.max(0, LANGS.indexOf(lg));
    return { lang: lg, li, ui: (k) => T(k), get: (p) => { const v = curT(lg, p); return v == null || v === '' ? curT(LANGS[0], p) : v; }, data: (n) => curD(n) || {}, setRef: (l, p, v) => setT(l, p, v, true) };
  }
  function titleOf(sp, item, i) { try { const t = sp.item && sp.item.title ? sp.item.title(item, ctx(), i) : ''; return normT(t) || T('item') + ' ' + (i + 1); } catch (e) { return T('item') + ' ' + (i + 1); } }
  function commitWork() { setD(S.work.ds, S.work.data); }
  function imgURL(f, v) {
    if (v == null || v === '') return f.empty || 'assets/st-empty.svg';
    v = String(v);
    let p = /[\/:]/.test(v) ? v : (f.dir || '') + v + (f.ext || '');
    if (own(S.draft.img, p)) p = S.draft.img[p];
    return p;
  }
  function firstImage(sp, item) {
    for (const f of (sp.item && sp.item.fields) || []) {
      const v = f.k === '$' ? item : f.k != null && item ? item[f.k] : undefined;
      if (f.type === 'image') return imgURL(f, v);
      if (f.type === 'images' && Array.isArray(v) && v.length) return imgURL(f, v[0]);
    }
    return null;
  }
  function renderListView(L, fromSel) {
    S.L = L; if (!L) return renderSelTab();
    const sp = dsSpec(L.ds); if (!sp) { if (fromSel) S.item = null; else S.list = null; return renderPanel(); }
    if (!S.P) return body(note(T('loading')));
    if (!S.work || S.work.ds !== L.ds) S.work = { ds: L.ds, data: curD(L.ds) };
    const data = S.work.data;
    const backAll = h('button', { type: 'button', class: 'back', onclick: () => { if (fromSel) { S.item = null; S.sel = null; highlight(null); } else S.list = null; renderPanel(); } }, icon('back'), fromSel ? T('back') : T('tabLists'));
    if (sp.lines || sp.phones) {
      const ta = linesInput(data, (v) => { S.work.data = v; commitWork(); }, { phones: sp.phones, aria: tr(sp.title) });
      return body(backAll, head(T('kList'), tr(sp.title)), sp.hint ? note(tr(sp.hint)) : null, h('div', { class: 'fld' }, ta, h('p', { class: 'hint', text: sp.phones ? T('phoneHint') : T('lineHint') })));
    }
    if (L.idx == null || !Array.isArray(data) || data[L.idx] === undefined) {
      L.idx = null;
      const list = h('ul', { class: 'ds-list' });
      data.forEach((item, i) => {
        const im = firstImage(sp, item);
        list.append(h('li', null,
          h('button', { type: 'button', class: 'open', onclick: () => { L.idx = i; L.sub = []; renderPanel(); } }, im ? h('img', { class: 'mini', src: im, alt: '' }) : null, h('span', { class: 't', text: titleOf(sp, item, i) })),
          sp.fixed ? null : h('span', { class: 'ops' },
            ibtn('up', T('up'), () => moveItem(i, -1)), ibtn('down', T('down'), () => moveItem(i, 1)), ibtn('x', T('del'), () => delItem(i, titleOf(sp, item, i)), 'danger'))));
      });
      return body(backAll, head(T('kList'), tr(sp.title)), sp.hint ? note(tr(sp.hint)) : null, list,
        sp.fixed ? null : h('button', { type: 'button', class: 'btn', onclick: (e) => addItem(e.currentTarget) }, icon('plus'), sp.item && sp.item.add && sp.item.add.upload ? T('addPhoto') : T('add')));
    }
    const i = L.idx, item = data[i];
    const back = h('button', { type: 'button', class: 'back', onclick: () => { L.idx = null; renderPanel(); } }, icon('back'), tr(sp.title));
    const form = h('div', null);
    renderFields(form, sp.item.fields, () => S.work.data[i], (v) => { S.work.data[i] = v; }, { root: true, sub: L.sub, idx: i });
    const ops = sp.fixed ? null : h('div', { class: 'acts' },
      h('button', { type: 'button', class: 'btn sm', onclick: () => { moveItem(i, -1); } }, icon('up'), T('up')),
      h('button', { type: 'button', class: 'btn sm', onclick: () => { moveItem(i, 1); } }, icon('down'), T('down')),
      h('button', { type: 'button', class: 'btn sm danger', onclick: () => delItem(i, titleOf(sp, item, i)) }, icon('x'), T('del')));
    body(fromSel ? null : backAll, back, head(T('listOf', tr(sp.title)), titleOf(sp, item, i)), form, ops);
    setTimeout(() => { const hl = $('pbody').querySelector('.hl, [data-focus]'); if (hl) hl.scrollIntoView({ block: 'center' }); }, 30);
  }
  function moveItem(i, d) {
    const a = S.work.data, j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; commitWork();
    if (S.L.idx != null) S.L.idx = j;
    renderPanel();
  }
  async function delItem(i, name) {
    const sp = dsSpec(S.work.ds), min = sp.min || 0;
    if (S.work.data.length <= min) return toast(T('minItems', min), true);
    if (!(await confirmDialog(T('delQ', name)))) return;
    S.work.data.splice(i, 1); commitWork(); S.L.idx = null; renderPanel();
  }
  function addItem(btn) {
    const sp = dsSpec(S.work.ds), ad = sp.item && sp.item.add;
    const push = (v) => { S.work.data.push(v); commitWork(); S.L.idx = S.work.data.length - 1; S.L.sub = []; renderPanel(); };
    if (ad && ad.upload) return chooseImage(btn, (url) => push(ad.make(url)));
    push(typeof ad === 'function' ? ad(ctx()) : clone(S.work.data[S.work.data.length - 1]) || '');
  }

  /* рендер полей элемента: get() → объект, set(v) — заменить объект */
  function renderFields(box, fields, get, set, o = {}) {
    const item = get();
    for (const f of fields || []) {
      if (f.when && !f.when(item)) continue;
      const el = fieldEl(f, get, set, o);
      if (el) box.append(el);
    }
  }
  function valOf(f, item) { return f.k === '$' ? item : item != null ? item[f.k] : undefined; }
  function putVal(f, get, set, v) {
    if (f.k === '$') { set(v); return; }
    const item = get();
    if (v === undefined) delete item[f.k]; else item[f.k] = v;
  }
  function fieldEl(f, get, set, o) {
    const item = get();
    const label = tr(f.label) + (f.optional ? ' (' + T('optional') + ')' : '');
    const hint = f.hint ? h('p', { class: 'hint', text: tr(f.hint) }) : D.createDocumentFragment();
    const commit = () => commitWork();
    const focusSub = o.sub && o.sub.length && (o.sub[0] === f.k || (f.k === '$' && typeof o.sub[0] === 'number'));
    switch (f.type) {
      case 'ref': {
        let path; try { path = f.path(item); } catch (e) { return null; }
        const isNew = LANGS.every((lg) => defT(lg, path) === undefined);
        const w = langField(label, {
          kind: f.sub === 'lines' ? 'lines' : f.sub === 'textarea' ? 'textarea' : 'text', hint: tr(f.hint), fallback: isNew,
          get: (lg) => curT(lg, path),
          set: (lg, v) => {
            if (isNew && lg !== LANGS[0] && (v === '' || (Array.isArray(v) && !v.length))) v = clone(curT(LANGS[0], path));
            setT(lg, path, v);
            if (isNew && lg === LANGS[0]) LANGS.slice(1).forEach((l2) => { const c = curT(l2, path); if (c == null || c === '' || (Array.isArray(c) && !c.length) || eq(c, S._lastAz && S._lastAz[path])) setT(l2, path, v, true); });
            if (lg === LANGS[0]) { S._lastAz = S._lastAz || {}; S._lastAz[path] = clone(v); }
          },
          changed: (lg) => hasT(lg, path) && !isNew,
          revert: isNew ? null : () => LANGS.forEach((lg) => setT(lg, path, undefined))
        });
        if (o.root && S.L && S.L.focusRef === path) w.setAttribute('data-focus', '');
        return w;
      }
      case 'i18n': case 'i18nArr': {
        const arr = f.type === 'i18nArr';
        const read = () => { const v = valOf(f, get()); if (typeof v === 'string') return LANGS.reduce((a, l) => ((a[l] = v), a), {}); if (arr) return LANGS.reduce((a, l, i) => ((a[l] = (v || [])[i] || ''), a), {}); return Object.assign({}, v || {}); };
        return langField(label, {
          kind: f.sub === 'textarea' ? 'textarea' : 'text', hint: tr(f.hint),
          get: (lg) => read()[lg] || '',
          set: (lg, v) => {
            const cur = read(); cur[lg] = v;
            let out = arr ? LANGS.map((l) => cur[l] || '') : cur;
            if (f.collapse && LANGS.every((l) => cur[l] === cur[LANGS[0]])) out = cur[LANGS[0]];
            putVal(f, get, set, out); commit();
          }
        });
      }
      case 'dict': {
        const key = String(item);
        return dictField(f.dict, key, label);
      }
      case 'text': case 'textarea': {
        const w = h('div', { class: 'fld' + (f.w ? ' ' + f.w : '') }, lab(label));
        const inp = plainInput(valOf(f, item), (v) => { putVal(f, get, set, v); commit(); }, { multi: f.type === 'textarea', w: f.w, aria: label });
        w.append(inp); if (hint) w.append(hint);
        if (o.root && focusSub) w.setAttribute('data-focus', '');
        return w;
      }
      case 'number': {
        const w = h('div', { class: 'fld' + (f.w ? ' ' + f.w : '') }, lab(label));
        const v = valOf(f, item);
        const inp = h('input', { class: 'inp' + (f.w ? ' ' + f.w : ''), type: 'number', inputmode: 'decimal', step: f.step || 'any', min: f.min != null ? f.min : null, max: f.max != null ? f.max : null, value: v == null ? '' : String(v), 'aria-label': label });
        inp.addEventListener('input', () => { const s = inp.value.trim(); putVal(f, get, set, s === '' ? (f.optional ? null : 0) : +s); commit(); });
        w.append(inp); if (hint) w.append(hint);
        return w;
      }
      case 'date': {
        const w = h('div', { class: 'fld' + (f.w ? ' ' + f.w : '') }, lab(label));
        const inp = h('input', { class: 'inp sm', type: 'date', value: valOf(f, item) || '', 'aria-label': label });
        inp.addEventListener('change', () => { putVal(f, get, set, inp.value); commit(); });
        w.append(inp); if (hint) w.append(hint);
        return w;
      }
      case 'bool': {
        const inp = h('input', { type: 'checkbox' }); inp.checked = !!valOf(f, item);
        inp.addEventListener('change', () => { putVal(f, get, set, inp.checked); commit(); });
        return h('div', { class: 'fld' }, h('label', { class: 'chk' }, inp, h('span', { text: tr(f.label) })), hint);
      }
      case 'select': {
        let opts = []; try { opts = f.options(ctx()) || []; } catch (e) { opts = []; }
        const v = valOf(f, item);
        if (v != null && !opts.some((x) => x.v === v)) opts.push({ v, label: String(v) });
        const s = h('select', { class: 'sel', 'aria-label': label }, opts.map((x) => h('option', { value: x.v, text: normT(x.label) || x.v || '—' })));
        s.value = v == null ? '' : v;
        s.addEventListener('change', () => { putVal(f, get, set, s.value); commit(); });
        return h('div', { class: 'fld' + (f.w ? ' ' + f.w : '') }, lab(label), s, hint);
      }
      case 'lines': case 'phones': {
        const w = h('div', { class: 'fld' }, lab(label));
        w.append(linesInput(valOf(f, item), (v) => { putVal(f, get, set, v); commit(); }, { phones: f.type === 'phones', aria: label }), h('p', { class: 'hint', text: f.type === 'phones' ? T('phoneHint') : T('lineHint') }));
        if (hint) w.append(hint);
        if (o.root && focusSub) w.setAttribute('data-focus', '');
        return w;
      }
      case 'image': {
        const w = h('div', { class: 'fld' }, lab(label));
        const v = valOf(f, item);
        const th = h('div', { class: 'thumb' }, h('img', { src: imgURL(f, v), alt: '' }));
        const box = h('div', { class: 'imgbox' }, th);
        const acts = h('div', { class: 'acts' });
        const up = h('button', { type: 'button', class: 'btn sm gold', onclick: () => chooseImage(up, (url) => {
          const old = valOf(f, get());
          putVal(f, get, set, url);
          if (f.k === '$') renameDictKeys(old, url);
          commit(); th.firstChild.src = imgURL(f, url); renderPanelKeep();
        }) }, icon('img'), v ? T('imgChange') : T('imgUpload'));
        acts.append(up);
        if (f.empty !== undefined && v) acts.append(h('button', { type: 'button', class: 'btn sm', onclick: () => { putVal(f, get, set, ''); commit(); renderPanelKeep(); } }, icon('x'), T('imgRemove')));
        box.append(acts); w.append(box, hint);
        if (o.root && S.L && S.L.img && imgURL(f, v) === S.L.img) w.setAttribute('data-focus', '');
        return w;
      }
      case 'images': {
        const w = h('div', { class: 'fld' }, lab(label));
        const grid = h('div', { class: 'imgs' });
        const arr = () => { const a = valOf(f, get()); return Array.isArray(a) ? a : []; };
        arr().forEach((v, j) => {
          const hl = (S.L && S.L.img && imgURL(f, v) === S.L.img) || (o.root && focusSub && o.sub[1] === j);
          const it = h('div', { class: 'it' + (hl ? ' hl' : '') }, h('div', { class: 'thumb' }, h('img', { src: imgURL(f, v), alt: '' })),
            h('div', { class: 'row' },
              ibtn('up', T('up'), () => { const a = arr(); if (j > 0) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; putVal(f, get, set, a); commit(); renderPanelKeep(); } }),
              ibtn('img', T('imgChange'), (e) => chooseImage(e.currentTarget, (url) => { const a = arr(); const old = a[j]; a[j] = url; putVal(f, get, set, a); if (f.caption) renameDictKeys(old, url, f.caption); commit(); renderPanelKeep(); })),
              ibtn('x', T('del'), () => { const a = arr(); if (a.length <= (f.min || 0)) return toast(T('minItems', f.min), true); a.splice(j, 1); putVal(f, get, set, a); commit(); renderPanelKeep(); }, 'danger')));
          if (f.caption) {
            const cap = h('div', { class: 'cap' });
            LANGS.forEach((lg, li) => {
              const d = curD(f.caption) || {}; const c = d[v] || [];
              const inp = h('input', { class: 'inp', type: 'text', lang: lg, placeholder: lg.toUpperCase(), value: c[li] || '', 'aria-label': tr(f.label) + ' ' + lg.toUpperCase() });
              inp.addEventListener('input', () => { const dd = curD(f.caption) || {}; const a = (dd[v] || LANGS.map(() => '')).slice(); a[li] = inp.value; dd[v] = a; setD(f.caption, dd); });
              cap.append(inp);
            });
            it.append(cap);
          }
          grid.append(it);
        });
        const add = h('button', { type: 'button', class: 'addimg', onclick: () => chooseImage(add, (url) => { const a = arr(); a.push(url); putVal(f, get, set, a); commit(); renderPanelKeep(); }) }, icon('plus'), T('addPhoto'));
        grid.append(add);
        w.append(grid, hint);
        if (o.root && (focusSub || (S.L && S.L.img))) w.setAttribute('data-focus', '');
        return w;
      }
      case 'group': {
        const g = h('div', { class: 'group' }, h('div', { class: 'lbl', text: tr(f.label) }));
        const row = h('div', { class: f.inline ? 'frow' : '' });
        const gget = f.k ? () => { const it = get(); if (it[f.k] == null || typeof it[f.k] !== 'object') it[f.k] = {}; return it[f.k]; } : get;
        const gset = f.k ? (v) => { get()[f.k] = v; } : set;
        renderFields(row, f.fields, gget, gset, {});
        g.append(row);
        return g;
      }
      case 'list': {
        const w = h('div', { class: 'fld' }, lab(label));
        const sub = f.item || {};
        const arr = () => { const a = valOf(f, get()); return Array.isArray(a) ? a : []; };
        const simple = (sub.fields || []).every((x) => ['text', 'number', 'select', 'date'].includes(x.type) && x.k !== '$');
        const rows = h('div', { class: 'rows' });
        arr().forEach((row, j) => {
          const hl = o.root && focusSub && (f.k === '$' ? o.sub[0] === j : o.sub[1] === j);
          const rget = () => arr()[j];
          const rset = (v) => { const a = arr(); a[j] = v; putVal(f, get, set, a); };
          if (simple) {
            const cells = h('div', { class: 'cells' });
            for (const sf of sub.fields) {
              const v = valOf(sf, row);
              let inp;
              if (sf.type === 'number') { inp = h('input', { class: 'inp', type: 'number', inputmode: 'decimal', step: sf.step || 'any', value: v == null ? '' : String(v), 'aria-label': tr(sf.label) }); inp.addEventListener('input', () => { const s = inp.value.trim(); rget()[sf.k] = s === '' ? 0 : +s; commit(); }); }
              else if (sf.type === 'select') { let opts = []; try { opts = sf.options(ctx()) || []; } catch (e) {} if (v != null && !opts.some((x) => x.v === v)) opts.push({ v, label: String(v) }); inp = h('select', { class: 'sel', 'aria-label': tr(sf.label) }, opts.map((x) => h('option', { value: x.v, text: normT(x.label) || x.v }))); inp.value = v == null ? '' : v; inp.addEventListener('change', () => { rget()[sf.k] = inp.value; commit(); }); }
              else if (sf.type === 'date') { inp = h('input', { class: 'inp', type: 'date', value: v || '', 'aria-label': tr(sf.label) }); inp.addEventListener('change', () => { rget()[sf.k] = inp.value; commit(); }); }
              else { inp = h('input', { class: 'inp', type: 'text', value: v == null ? '' : String(v), 'aria-label': tr(sf.label) }); inp.addEventListener('input', () => { rget()[sf.k] = inp.value; commit(); }); inp.addEventListener('change', () => { const q = smartQuotes(inp.value, 'az'); if (q !== inp.value) { inp.value = q; rget()[sf.k] = q; commit(); } }); }
              cells.append(h('div', { class: 'c' + (sf.w ? ' ' + sf.w : '') }, j === 0 ? h('span', { class: 'l', text: tr(sf.label) }) : null, inp));
            }
            const ops = f.fixed ? null : h('div', { class: 'ops' },
              ibtn('up', T('up'), () => { const a = arr(); if (j > 0) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; putVal(f, get, set, a); commit(); renderPanelKeep(); } }),
              ibtn('x', T('del'), () => { const a = arr(); a.splice(j, 1); putVal(f, get, set, a); commit(); renderPanelKeep(); }, 'danger'));
            const r = h('div', { class: 'rowe' + (hl ? ' hl' : '') }, cells, ops);
            if (hl) r.setAttribute('data-focus', '');
            rows.append(r);
          } else {
            const card = h('div', { class: 'card' + (hl ? ' hl' : '') });
            const st = sub.title ? (() => { try { return normT(sub.title(row, ctx(), j)); } catch (e) { return ''; } })() : '';
            if (st) card.append(h('h4', { text: st }));
            renderFields(card, sub.fields, rget, rset, {});
            if (!f.fixed) card.append(h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn sm danger', onclick: () => { const a = arr(); a.splice(j, 1); putVal(f, get, set, a); commit(); renderPanelKeep(); } }, icon('x'), T('del'))));
            if (hl) card.setAttribute('data-focus', '');
            rows.append(card);
          }
        });
        w.append(rows);
        if (!f.fixed) w.append(h('button', { type: 'button', class: 'btn sm', onclick: () => { const a = arr(); a.push(sub.add ? sub.add(ctx()) : clone(a[a.length - 1]) || ''); putVal(f, get, set, a); commit(); renderPanelKeep(); const last = $('pbody').querySelectorAll('.rows')[0]; } }, icon('plus'), T('add')));
        if (hint) w.append(hint);
        return w;
      }
    }
    return null;
  }
  function renameDictKeys(oldK, newK, dictName) {
    const names = dictName ? [dictName] : Object.keys(S.page.data || {}).filter((n) => S.page.data[n].dict);
    names.forEach((n) => { const d = curD(n); if (d && oldK != null && own(d, oldK) && !own(d, newK)) { d[newK] = d[oldK]; setD(n, d); } });
  }
  function renderPanelKeep() { const b = $('pbody'), y = b.scrollTop; renderPanel(); b.scrollTop = y; }

  /* ───────────── вкладка «Mətnlər» ───────────── */
  function renderTexts() {
    if (!S.P) return body(note(T('loading')));
    const lg = S.plang, base = S.P.def.I[LANGS[0]] || {}, rows = [];
    (function walk(o, pre, dep) {
      if (dep > 6 || !o) return;
      for (const k of Object.keys(o)) { const v = o[k], p = pre ? pre + '.' + k : k; if (typeof v === 'string') rows.push(p); else if (v && typeof v === 'object') walk(v, p, dep + 1); }
    })(base, '', 0);
    const list = h('ul', { class: 'tlist' });
    const q = h('input', { class: 'inp', type: 'search', placeholder: T('textsSearch'), 'aria-label': T('textsSearch') });
    const draw = () => {
      const s = normT(q.value).toLowerCase();
      const items = rows.filter((p) => !s || LANGS.some((l) => normT(curT(l, p) || '').toLowerCase().includes(s))).slice(0, 400);
      list.replaceChildren(...items.map((p) => h('li', null, h('button', { type: 'button', class: LANGS.some((l) => hasT(l, p)) ? 'chg' : '', onclick: () => { const el = S.doc && S.doc.querySelector('[data-i18n="' + p + '"],[data-i18n-html="' + p + '"]'); if (el) el.scrollIntoView({ block: 'center' }); showText([p], el, { html: !!(el && el.hasAttribute('data-i18n-html')) }); } },
        h('span', { class: 'v', text: normT(curT(lg, p) || curT(LANGS[0], p) || '') || '—' })))));
      if (!items.length) list.append(h('li', { class: 'empty', text: T('textsNone') }));
    };
    q.addEventListener('input', draw);
    body(h('div', { class: 'search' }, q), note(T('textsNote')), list);
    draw();
  }

  /* ───────────── вкладка «Əlaqə» ───────────── */
  function renderContacts() {
    if (!S.doc) return body(note(T('loading')));
    const tels = new Map();
    const addT = (d, wa) => { d = normTel(d); if (d.length < 9) return; const r = tels.get(d) || { d, wa: false }; r.wa = r.wa || !!wa; tels.set(d, r); };
    S.doc.querySelectorAll('a[href^="tel:"]').forEach((a) => addT(a.getAttribute('data-st-href') || a.getAttribute('href')));
    S.doc.querySelectorAll('a[href*="wa.me/"]').forEach((a) => { const m = /wa\.me\/(\d+)/.exec(a.getAttribute('data-st-href') || a.getAttribute('href')); if (m) addT(m[1], true); });
    ((S.P && S.P.wa) || []).forEach((n) => addT(n, true));
    const links = new Map();
    S.doc.querySelectorAll('a[href^="http"]').forEach((a) => {
      if (a.closest('[data-st-demo],#st-demo-mark')) return;
      const href = a.getAttribute('data-st-href') || a.getAttribute('href');
      if (/wa\.me\/|api\.whatsapp\.com/i.test(href) || links.has(href)) return;
      let label = normT(a.textContent) || normT(a.getAttribute('aria-label') || '');
      if (!label) { try { label = new URL(href).hostname.replace(/^www\./, ''); } catch (e) { label = href; } }
      links.set(href, label.length > 60 ? label.slice(0, 58) + '…' : label);
    });
    body(
      h('div', { class: 'sec' }, h('h3', { text: T('phones') }), note(T('phonesNote')),
        tels.size ? h('div', { class: 'kv' }, [...tels.values()].map((t) => h('div', { class: 'r' }, phoneBlock(t.d)))) : note(T('noPhones'))),
      h('div', { class: 'sec' }, h('h3', { text: T('links') }), note(T('linksNote')),
        links.size ? h('div', { class: 'kv' }, [...links.entries()].map(([href, label]) => h('div', { class: 'r' }, hrefBlock(href, label)))) : note(T('noLinks')))
    );
  }

  /* ───────────── вкладка «Tarixçə» ───────────── */
  async function renderHistory() {
    if (S.mode !== 'server') return body(note(T('histDemo')));
    body(h('h3', { text: T('history') }), note(T('loading')));
    const r = await api('history');
    if (S.tab !== 'history') return;
    if (!r.ok) return body(note(T('errGeneric'), 'bad'));
    const items = r.items || [];
    body(head(null, T('history')), note(T('histNote')),
      items.length ? h('ul', { class: 'hist' }, items.map((it) => h('li', null,
        h('span', { class: 't' }, T('version', it.rev), h('small', { text: when(it.time) + (it.rev === S.pub.rev ? ' — ' + T('current') : '') })),
        it.rev === S.pub.rev ? null : h('button', { type: 'button', class: 'btn sm', onclick: () => restoreRev(it) }, icon('undo'), T('restore'))))) : note(T('histEmpty')));
  }
  async function restoreRev(it) {
    if (!(await confirmDialog(T('restoreQ', when(it.time))))) return;
    const r = await api('restore', { body: { rev: it.rev } });
    if (!r.ok) return toast(T('errGeneric'), true);
    S.pub = normC(r.content); S.draft = normC(r.content); clearAutosave();
    toast(T('restored')); afterBigChange(); setTab('history');
  }

  /* ───────────── публикация ───────────── */
  /* событие для статистики демо (SpectrTech Lead Monitor на spectrtech.az): только факт сохранения, без содержимого */
  function saved(ok) { try { W.dispatchEvent(new CustomEvent('st-editor', { detail: { type: 'save', ok: !!ok, mode: S.mode } })); } catch (e) {} }
  async function publish() {
    if (!S.started || !countDiff()) return;
    const btn = $('publishBtn');
    const c = tidy(S.draft); c.site = SITE;
    if (S.mode === 'demo') {
      c.demo = true;
      try { localStorage.setItem('stx_demo:' + SITE, JSON.stringify(c)); }
      catch (e) { saved(false); return toast(T('demoFull'), true); }
      S.pub = normC(c); S.draft = normC(c); clearAutosave(); updateStatus(); saved(true); return toast(T('savedDemo'));
    }
    btn.disabled = true; btn.textContent = T('publishing');
    let r = await api('save', { body: { rev: S.pub.rev, content: c } });
    if (!r.ok && r.error === 'conflict') {
      btn.textContent = T('publish');
      if (await confirmDialog(T('conflictP'), T('conflictT'), T('conflictGo'))) r = await api('save', { body: { rev: r.rev, content: c } });
      else { updateStatus(); return; }
    }
    updateStatus();
    if (!r.ok) { saved(false); if (r.status === 401) return; return toast(r.error === 'too_large' ? T('tooLarge') : r.error === 'network' ? T('netErr') : T('errGeneric'), true); }
    c.rev = r.rev; c.updated = r.updated; c.demo = false;
    S.pub = normC(c); S.draft = normC(c); clearAutosave(); updateStatus(); saved(true);
    toast(T('published'));
  }
  async function discardAll() {
    if (!countDiff()) return;
    if (!(await confirmDialog(T('discardQ')))) return;
    S.draft = normC(S.pub); clearAutosave(); afterBigChange(); toast(T('discarded'));
  }
  async function resetDemo() {
    if (!(await confirmDialog(T('resetDemoQ')))) return;
    try { localStorage.removeItem('stx_demo:' + SITE); } catch (e) {}
    clearAutosave();
    const c = normC(W.ST_CONTENT); c.demo = true;
    S.pub = normC(c); S.draft = normC(c); afterBigChange(); toast(T('resetDone'));
  }
  async function logout() {
    if (countDiff()) autosave();
    dropToken(); S.started = false; location.reload();
  }

  /* ───────────── загрузка фото ───────────── */
  function chooseImage(btn, cb) {
    const inp = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif' });
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = T('uploading'); }
      try { const url = await uploadImage(f); cb(url); }
      catch (e) { toast(String(e && e.message ? e.message : e), true); }
      finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = label; } }
    });
    inp.click();
  }
  function loadImg(file) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(u); res(im); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error(T('badImage'))); };
      im.src = u;
    });
  }
  async function uploadImage(file) {
    const maxMB = Math.round(S.maxUpload / 1048576);
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error(T('badImage'));
    if (file.size > 40 * 1048576) throw new Error(T('fileTooBig', 40));
    let blob = file, ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    if (!(file.type === 'image/gif' && file.size < 3 * 1048576)) {
      const im = await loadImg(file);
      const max = S.mode === 'demo' ? 1400 : 2000;
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const w = Math.max(1, Math.round(im.naturalWidth * k)), hh = Math.max(1, Math.round(im.naturalHeight * k));
      const cv = D.createElement('canvas'); cv.width = w; cv.height = hh;
      const g = cv.getContext('2d'); g.drawImage(im, 0, 0, w, hh);
      let alpha = false;
      if (file.type === 'image/png' || file.type === 'image/webp') {
        try { const sm = D.createElement('canvas'); sm.width = 48; sm.height = 48; const sg = sm.getContext('2d'); sg.drawImage(im, 0, 0, 48, 48); const px = sg.getImageData(0, 0, 48, 48).data; for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { alpha = true; break; } } catch (e) {}
      }
      const type = alpha ? 'image/png' : 'image/jpeg';
      blob = await new Promise((r) => cv.toBlob(r, type, S.mode === 'demo' ? 0.8 : 0.86));
      if (!blob) throw new Error(T('badImage'));
      ext = alpha ? 'png' : 'jpg';
    }
    if (S.mode === 'demo') return await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error(T('uploadFailed'))); fr.readAsDataURL(blob); });
    if (blob.size > S.maxUpload) throw new Error(T('fileTooBig', maxMB));
    const fd = new FormData(); fd.append('file', blob, 'photo.' + ext);
    const r = await api('upload', { form: fd });
    if (!r.ok || !r.url) throw new Error(r.error === 'too_large' ? T('fileTooBig', maxMB) : r.error === 'bad_type' ? T('badImage') : T('uploadFailed'));
    return r.url;
  }

  /* ───────────── диалоги ───────────── */
  function dialog(build) {
    return new Promise((res) => {
      const d = $('dlg');
      const done = (v) => { d.close(); res(v); };
      d.replaceChildren(build(done));
      d.onclose = () => res(undefined);
      d.oncancel = (e) => { if (d.dataset.locked) e.preventDefault(); };
      d.showModal();
      const f = d.querySelector('input,button.primary,button.gold'); if (f) f.focus();
    });
  }
  function confirmDialog(text, title, okLabel) {
    return dialog((done) => h('div', { class: 'in' }, title ? h('h2', { text: title }) : null, h('p', { text }),
      h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: () => done(false) }, T('cancel')), h('button', { type: 'button', class: 'btn primary', onclick: () => done(true) }, okLabel || T('yes'))))).then((v) => !!v);
  }
  function promptDialog(label, value) {
    return dialog((done) => {
      const inp = h('input', { class: 'inp', type: 'url', value: value || '' });
      return h('form', { onsubmit: (e) => { e.preventDefault(); done(inp.value.trim()); } }, h('label', { text: label }), inp,
        h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn', onclick: () => done(null) }, T('cancel')), h('button', { type: 'submit', class: 'btn primary' }, T('save'))));
    });
  }
  function passwordDialog(forced, oldPw) {
    const d = $('dlg'); if (forced) d.dataset.locked = '1'; else delete d.dataset.locked;
    return dialog((done) => {
      const old = h('input', { class: 'inp', type: 'password', autocomplete: 'current-password', id: 'pwo' });
      const n1 = h('input', { class: 'inp', type: 'password', autocomplete: 'new-password', id: 'pwn', minlength: '8' });
      const n2 = h('input', { class: 'inp', type: 'password', autocomplete: 'new-password', id: 'pwr', minlength: '8' });
      const err = h('p', { class: 'err', role: 'alert' });
      const sub = h('button', { type: 'submit', class: 'btn primary' }, T('save'));
      const f = h('form', { novalidate: true, onsubmit: async (e) => {
        e.preventDefault(); err.textContent = '';
        if (n1.value.length < 8) { err.textContent = T('pwShort'); return n1.focus(); }
        if (n1.value !== n2.value) { err.textContent = T('pwMismatch'); return n2.focus(); }
        sub.disabled = true;
        const r = await api('password', { body: { old: forced ? oldPw : old.value, new: n1.value } });
        sub.disabled = false;
        if (!r.ok) { err.textContent = r.error === 'bad_password' ? T('pwWrongOld') : r.error === 'weak' ? T('pwShort') : T('errGeneric'); return; }
        saveToken(r.token, S.remember);
        delete d.dataset.locked; toast(T('pwChanged')); done(true);
      } },
      h('h2', { text: forced ? T('pwForceT') : T('pwT') }), forced ? h('p', { text: T('pwForceP') }) : null,
      forced ? null : h('div', { class: 'fld' }, h('label', { for: 'pwo', text: T('pwOld') }), old),
      h('div', { class: 'fld' }, h('label', { for: 'pwn', text: T('pwNew') }), n1),
      h('div', { class: 'fld' }, h('label', { for: 'pwr', text: T('pwRep') }), n2), err,
      h('div', { class: 'acts' }, forced ? null : h('button', { type: 'button', class: 'btn', onclick: () => done(false) }, T('cancel')), sub));
      return f;
    }).then((v) => !!v);
  }
  let tt = null;
  function toast(text, bad) {
    const t = $('toast'); t.textContent = text; t.className = 'toast on' + (bad ? ' bad' : '');
    clearTimeout(tt); tt = setTimeout(() => { t.className = 'toast' + (bad ? ' bad' : ''); }, bad ? 5200 : 3200);
  }

  /* ───────────── старт ───────────── */
  try { D.execCommand('styleWithCSS', false, false); } catch (e) {}
  $('loginForm').addEventListener('submit', doLogin);
  $('pwShow').addEventListener('click', () => { const p = $('pw'), on = p.type === 'password'; p.type = on ? 'text' : 'password'; $('pwShow').setAttribute('aria-pressed', String(on)); });
  boot();
})();
