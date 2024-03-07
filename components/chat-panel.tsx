import { type UseChatHelpers } from 'ai/react'
import { useState } from 'react';
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box';
import { Button as MuiButton } from '@mui/material';
import CatchingPokemonSharpIcon from '@mui/icons-material/CatchingPokemonSharp';

import { Button } from '@/components/ui/button'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'
import { IconRefresh, IconStop } from '@/components/ui/icons'
import { FooterText } from '@/components/footer'
import { errorToaster } from '@/components/toaster'

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    | 'append'
    | 'isLoading'
    | 'reload'
    | 'messages'
    | 'stop'
    | 'input'
    | 'setInput'
    | 'setMessages'
  > {
  chatDone: boolean
  id?: string
}

type ConfirmationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const lang = process.env.LANG || 'zh' // default to zh
var texts = {
  musicPlaceholder: '',
  postPlaceholder: '',
  imgPlaceholder: '',
  philosophyPlacehodler: '',
  blobTreePlaceholder: '',
  QAPlaceholder: '',
  QAPlaceholderComplex: '',
  generate: '',
  stop: '',
  imgErrorInfo: '',
  blobTreeErrorInfo: '',
  singleSelectErrorInfo: '',
  retest: '',
  reanswer: ''
};
if (lang === 'zh') {
  texts.musicPlaceholder = '请输入一首您喜欢的歌曲名。'
  texts.postPlaceholder = '请输入您的个人动态（以中文分号或换行符分隔）。'
  texts.imgPlaceholder = '请选择您喜欢的图片选项。(1-9)'
  texts.philosophyPlacehodler = '请选择上面的选项 (ABCD) 或输入您自己的答案。'
  texts.blobTreePlaceholder = '请输入您的选择的 blob 数字（1-21）。'
  texts.QAPlaceholder = '（单选）选择上面的选项 (ABCD) 。'
  texts.QAPlaceholderComplex = '（多选/问答）选择上面的选项 (ABCD) 或输入您自己的答案。'
  texts.generate = '重新生成回复'
  texts.stop = '停止生成'
  texts.imgErrorInfo = '格式错误，请仅输入 1-9 之间的数字。'
  texts.blobTreeErrorInfo = '格式错误，请仅输入 1-21 之间的数字。'
  texts.singleSelectErrorInfo = '单选题只能选择一个预设选项。'
  texts.retest = '重新评测'
  texts.reanswer = '重新回答上个问题'
} else if (lang === 'en') {
  texts.musicPlaceholder = 'Please enter the name of a song you like.'
  texts.postPlaceholder = 'Please enter your personal posts (separated by semicolons or newlines).'
  texts.imgPlaceholder = 'Please select your favourite images options (1-9).'
  texts.philosophyPlacehodler = 'Please select above options (ABCD) or enter your own answer.'
  texts.blobTreePlaceholder = 'Please enter the blob number of your choice (1-21).'
  texts.QAPlaceholder = 'Select above options or enter your own answer.'
  texts.QAPlaceholderComplex = 'Select above options (ABCD) or enter your own answer.'
  texts.generate = 'Regenerate response'
  texts.stop = 'Stop generating'
  texts.imgErrorInfo = 'Answer format error, please enter only numbers between 1-9.'
  texts.blobTreeErrorInfo = 'Answer format error, please enter only numbers between 1-21.'
  texts.singleSelectErrorInfo = 'Single select question can only select one of the preset options.'
  texts.retest = 'Test again'
  texts.reanswer = 'Reanswer the previous question'
}

const ConfirmationDialog = ({ isOpen, onClose, onConfirm }: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div style={{ display: isOpen ? 'block' : 'none'}}>
      <p style={{textAlign: 'center', fontSize: '18px'}}><b>您确定要开启新评测吗？</b></p>
    <Box
        sx={{
            display: 'grid',
            columnGap: 3,
            rowGap: 0,
            marginRight: 2,
            marginLeft: 2,
            marginDown: 0,
            marginTop: 2,
            gridTemplateColumns: 'repeat(2, 1fr)',
        }}
    >
      <MuiButton variant={'outlined'} sx={{ m: 0, border: 1, borderRadius: 2, boxShadow: 4, color: 'hsl(var(--primary))' }} onClick={handleConfirm}>确认</MuiButton>
      <MuiButton variant={'outlined'} sx={{ m: 0, border: 1, borderRadius: 2, boxShadow: 4, color: 'hsl(var(--primary))' }} onClick={onClose}>取消</MuiButton>
    </Box>
    </div>
  );
};

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages,
  setMessages,
  chatDone
}: ChatPanelProps) {
  const router = useRouter()
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isButtonASelected, setIsButtonASelected] = useState(false);
  const [isButtonBSelected, setIsButtonBSelected] = useState(false);
  const [isButtonCSelected, setIsButtonCSelected] = useState(false);
  const [isButtonDSelected, setIsButtonDSelected] = useState(false);

  const handleCloseConfirmation = () => {
    setIsConfirmationOpen(false);
  };

  const handleNewChat = () => {
    setIsConfirmationOpen(true);
  };

  const handleConfirmNewChat = () => {
    router.refresh()
    router.push('/')
  };

  const handleReanswer = () => {
    if (isLoading) {
      stop()
    } else {
      setMessages(messages.slice(0, -2))
    }
  };

  const checkValue = (value: string) => {
    if (messages?.length === 6) {
      const intValue = parseInt(value)
      if (isNaN(intValue) || intValue < 1 || intValue > 9) {
        errorToaster(texts.imgErrorInfo)
        return false
      }
    } else if (messages?.length === 8) {
      const intValue = parseInt(value)
      if (isNaN(intValue) || intValue < 1 || intValue > 21) {
        errorToaster(texts.blobTreeErrorInfo)
        return false
      }
    }
    return true
  };


  const getQuestionOptionText = (originalInput: string, prefix: string) => {
    if (messages?.length === 0) {
      return ""
    }
    
    const question = messages[messages.length - 1].content
    const isMultiSelect = messages?.length > 13
    let escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let buttonPrefix = {
      '(A)': [isButtonASelected, setIsButtonASelected],
      '(B)': [isButtonBSelected, setIsButtonBSelected],
      '(C)': [isButtonCSelected, setIsButtonCSelected],
      '(D)': [isButtonDSelected, setIsButtonDSelected]
    } 

    if (!isMultiSelect) {
      // check if any button is selected
      const isButtonSelected = Object.values(buttonPrefix).some(([isSelected, _]) => isSelected)
      // check if the prefix is the same as the selected button
      // @ts-ignore
      const isPrefixSelected = prefix in buttonPrefix && buttonPrefix[prefix][0]
      if (isButtonSelected && !isPrefixSelected) {
        errorToaster(texts.singleSelectErrorInfo)
        return originalInput
      }
    }
    
    if (prefix in buttonPrefix) {
        // @ts-ignore
        let [isButtonSelected, setIsButtonSelected] = buttonPrefix[prefix]

        if (isButtonSelected) {
          let regex = new RegExp(`^${escapedPrefix}.*`, 'm');
          let newStr = originalInput.replace(regex, '');
          newStr = newStr.replace(/^\n/, '');
          newStr = newStr.replace(/\n\n/, '\n');
          setIsButtonSelected(false)
          return newStr
        } else {
          setIsButtonSelected(true)
        }
    }
    // case: prefix not in isButtonSelected or isButtonSelected[prefix] is false
    let regex = new RegExp(`^${escapedPrefix}.*$`, 'gm');
    let matches = question.match(regex);
    if (matches === null) {
      return originalInput
    }
    if (originalInput.length === 0) {
      return matches[0]
    } else {
      if (originalInput.endsWith('\n')) {
        return originalInput + matches[0]
      } else {
        return originalInput + '\n' + matches[0]
      }
    }
  }

  let placeholder = ''
  let enableOptionButtons = false
  if (isLoading) {
    placeholder = ''
  } else if (messages?.length === 0) {
    placeholder = ''
  } else if (messages?.length === 2) {  // start phase + ask for post
    placeholder = texts.musicPlaceholder
  } else if (messages?.length === 4) {
    placeholder = texts.postPlaceholder
  } else if (messages?.length === 6) {
    placeholder = texts.imgPlaceholder
  } else if (messages?.length === 8){ 
    placeholder = texts.blobTreePlaceholder
  } else if (messages?.length > 9 && messages?.length <= 13) { 
    placeholder = texts.QAPlaceholder
    if (messages[messages.length - 1].role === 'assistant') {
      enableOptionButtons = true
    }
  } else if (messages?.length > 13){ 
    placeholder = texts.QAPlaceholderComplex
    if (messages[messages.length - 1].role === 'assistant') {
      enableOptionButtons = true
    }
  } else {
    placeholder = ''
  }
  const isSearch = messages?.length === 2
  // TODO: add backstep when isLoading
  const isAvailableReanswer = !isLoading && !chatDone && ((messages?.length > 6 && messages?.length < 13) || (messages?.length > 14))

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50%">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="flex h-10 items-center justify-center">
        { chatDone && (
            <Button
              variant="outline"
              onClick={handleConfirmNewChat}
              className="bg-background"
            >
              <IconStop className="mr-2" />
              {texts.retest}
            </Button>
          )
        }
        { isAvailableReanswer && (
            <Button
              variant="outline"
              onClick={handleReanswer}
              className="bg-background"
            >
              <IconStop className="mr-2" />
              {texts.reanswer}
            </Button>
        )}
        </div>
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
            { isConfirmationOpen && (
                <ConfirmationDialog
                isOpen={isConfirmationOpen}
                onClose={handleCloseConfirmation}
                onConfirm={handleConfirmNewChat}
                />
            )}
            { enableOptionButtons && !isLoading && (
            <Box
                sx={{
                    display: 'grid',
                    columnGap: 3,
                    rowGap: 1,
                    marginRight: 2,
                    marginLeft: 2,
                    marginDown: 0,
                    gridTemplateColumns: 'repeat(2, 1fr)',
                }}
            >
            <MuiButton variant={'outlined'} sx={{
              m: 0, border: 1, borderRadius: 2, boxShadow: 4, color: 'hsl(var(--primary))', backgroundColor: isButtonASelected ? "#a5a8ac" : "transparent",
              '&:hover': {
                backgroundColor: isButtonASelected ? "#a5a8ac" : "transparent",
                border: '1px solid #000000'
              }
            }} disabled={isLoading} onClick={() => {
              setInput(getQuestionOptionText(input, '(A)'))
            }} startIcon={<CatchingPokemonSharpIcon />}>A</MuiButton>
            <MuiButton variant={'outlined'} sx={{
              m: 0, border: 1, borderRadius: 2, boxShadow: 4, color: 'hsl(var(--primary))', backgroundColor: isButtonBSelected ? "#a5a8ac" : "transparent",
              '&:hover': {
                backgroundColor: isButtonBSelected ? "#a5a8ac" : "transparent",
                border: '1px solid #000000'
              }
            }} disabled={isLoading} onClick={() => {
              setInput(getQuestionOptionText(input, '(B)'))
            }} startIcon={<CatchingPokemonSharpIcon />}>B</MuiButton>
            <MuiButton variant={'outlined'} sx={{
              m: 0, border: 1, borderRadius: 2, boxShadow: 4, color: 'hsl(var(--primary))', backgroundColor: isButtonCSelected ? "#a5a8ac" : "transparent",
              '&:hover': {
                backgroundColor: isButtonCSelected ? "#a5a8ac" : "transparent",
                border: '1px solid #000000'
              }
            }} disabled={isLoading} onClick={() => {
              setInput(getQuestionOptionText(input, '(C)'))
            }} startIcon={<CatchingPokemonSharpIcon />}>C</MuiButton>
            <MuiButton variant={'outlined'} sx={{
              m: 0, border: 1, borderRadius: 2, boxShadow: 4, color: 'hsl(var(--primary))', backgroundColor: isButtonDSelected ? "#a5a8ac" : "transparent",
              '&:hover': {
                backgroundColor: isButtonDSelected ? "#a5a8ac" : "transparent",
                border: '1px solid #000000'
              }
            }} disabled={isLoading} onClick={() => {
              setInput(getQuestionOptionText(input, '(D)'))
            }} startIcon={<CatchingPokemonSharpIcon />}>D</MuiButton>
            </Box>
            )}
          <PromptForm
            onSubmit={async value => {
              if (checkValue(value)) {
                await append({
                  id,
                  content: value,
                  role: 'user'
                })
                setIsButtonASelected(false)
                setIsButtonBSelected(false)
                setIsButtonCSelected(false)
                setIsButtonDSelected(false)
              }
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            placeholder={placeholder}
            handleNewChat={handleNewChat}
            isSearch={isSearch}
          />
          <FooterText className="hidden sm:block" />
        </div>
      </div>
    </div>
  )
}
