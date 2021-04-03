export default (): HTMLScriptElement => {
  const script = document.createElement('script');
  script.setAttribute('src', process.env.NEXT_PUBLIC_UTTERANCES_SRC);
  script.setAttribute('crossorigin', process.env.NEXT_PUBLIC_UTTERANCES_CORS);
  script.setAttribute('async', process.env.NEXT_PUBLIC_UTTERANCES_ASYNC);
  script.setAttribute('repo', process.env.NEXT_PUBLIC_UTTERANCES_REPO);
  script.setAttribute('label', process.env.NEXT_PUBLIC_UTTERANCES_LABEL);
  script.setAttribute(
    'issue-term',
    process.env.NEXT_PUBLIC_UTTERANCES_ISSUE_TERM
  );
  script.setAttribute('theme', process.env.NEXT_PUBLIC_UTTERANCES_THEME);

  return script;
};
