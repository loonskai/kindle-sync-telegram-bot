const cheerio = require('cheerio');

const parseNotebookJSON = (htmlNotebook) => {
  const $ = cheerio.load(htmlNotebook);
  const bookTitle = $('.bookTitle').text().trim();
  const authors = $('.authors').text().trim();
  const notes = $('.noteHeading')
    .map(function () {
      const color = $(this).find('span[class*=\'highlight\']').text() || null;
      return {
        color,
        text: $(this).next().text().trim(),
        location: parseInt($(this).text().match(/Location (\d+)/)[1], 10),
        isComment: !color,
      };
    })
    .toArray()
    .reduce((acc, { isComment, ...noteItem }, _, allNoteItems) => {
      if (isComment) return acc;
      return [
        ...acc,
        {
          ...noteItem,
          comments: allNoteItems.reduce(
            (commentsAcc, commentItem) => (
              commentItem.isComment && commentItem.location === noteItem.location
                ? [...commentsAcc, commentItem.text]
                : commentsAcc
            ), [],
          ),
        },
      ];
    }, []);

  return {
    bookTitle,
    authors,
    notes,
  };
};

module.exports = {
  parseNotebookJSON,
};
